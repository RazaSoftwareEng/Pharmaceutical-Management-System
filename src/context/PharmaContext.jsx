// src/context/PharmaContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { storageService, getSeedData, getEmptyData } from '../services/storageService';
import { cloudSyncService } from '../services/cloudSyncService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { allocateBatchesFEFO, evaluateBatchStatus } from '../services/pharmaService';

const PharmaContext = createContext(null);

// Next id after the highest numeric suffix in use, so ids stay unique after deletes.
function nextSequentialId(prefix, records, pad = 3) {
  const max = records.reduce((acc, r) => {
    if (!String(r.id).startsWith(prefix)) return acc;
    const n = parseInt(String(r.id).slice(prefix.length), 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

export function PharmaProvider({ children }) {
  // Local mode starts from the demo dataset; Supabase mode replaces this with the company's real data on load
  const [data, setData] = useState(() => storageService.loadAllInitial());

  // App UI State
  const [currentWarehouseId, setCurrentWarehouseId] = useState('ALL');
  // Role and audit identity come from the signed-in user
  const { user } = useAuth();
  const currentUserRole = user?.role || 'Storekeeper';
  const actor = user ? `${user.fullName} (${user.role})` : 'System';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Cloud sync state: 'local' | 'loading' | 'syncing' | 'synced' | 'error'
  const dataSource = isSupabaseConfigured ? 'supabase' : 'local';
  const [syncState, setSyncState] = useState({
    status: isSupabaseConfigured ? 'loading' : 'local',
    lastSyncedAt: null,
    error: null,
  });
  const syncedSnapshotRef = useRef(null); // last state known to be persisted in Supabase
  const pushQueueRef = useRef(Promise.resolve());
  const pendingPushesRef = useRef(0);
  const cloudLoadStartedRef = useRef(false);

  // Toast notification helper
  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ===================== CLOUD SYNC (SUPABASE) =====================
  const markSynced = () => setSyncState({ status: 'synced', lastSyncedAt: new Date(), error: null });

  const markSyncError = useCallback((e, toastPrefix) => {
    console.error(e);
    setSyncState((s) => ({ ...s, status: 'error', error: e.message }));
    showToast(`${toastPrefix}: ${e.message}`, 'danger', 6000);
  }, [showToast]);

  // Runs cloud writes one at a time, in the order they were requested.
  const enqueueCloudWrite = useCallback((task) => {
    pendingPushesRef.current += 1;
    setSyncState((s) => ({ ...s, status: 'syncing' }));
    const run = pushQueueRef.current.then(task).finally(() => {
      pendingPushesRef.current -= 1;
    });
    pushQueueRef.current = run.catch(() => {});
    return run.then(() => {
      if (pendingPushesRef.current === 0) markSynced();
    });
  }, []);

  const refreshFromCloud = useCallback(async ({ silent = false } = {}) => {
    if (!isSupabaseConfigured) return;
    setSyncState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      await pushQueueRef.current;
      let remote = await cloudSyncService.fetchAll();
      const initialised = !remote;
      if (initialised) {
        // A brand-new database starts empty: the company enters its own data
        remote = getEmptyData();
        await cloudSyncService.seed(remote);
      }
      syncedSnapshotRef.current = remote;
      setData(remote);
      markSynced();
      if (initialised) showToast('New company database created. Follow the setup checklist to get started.', 'info');
      else if (!silent) showToast('Latest data loaded from Supabase', 'info');
    } catch (e) {
      markSyncError(e, 'Could not load data from Supabase');
    }
  }, [markSyncError, showToast]);

  // Initial load from Supabase (guarded against StrictMode double-invoke)
  useEffect(() => {
    if (!isSupabaseConfigured || cloudLoadStartedRef.current) return;
    cloudLoadStartedRef.current = true;
    refreshFromCloud({ silent: true });
  }, [refreshFromCloud]);

  // Persist every state change: local cache always, Supabase as a row-level diff
  useEffect(() => {
    storageService.saveAll(data);
    const prev = syncedSnapshotRef.current;
    if (!isSupabaseConfigured || !prev || prev === data) return;
    syncedSnapshotRef.current = data;
    enqueueCloudWrite(() => cloudSyncService.pushDiff(prev, data)).catch((e) =>
      markSyncError(e, 'Cloud sync failed')
    );
  }, [data, enqueueCloudWrite, markSyncError]);

  // Overwrites Supabase with the current in-app state (recovery after a failed sync)
  const pushAllToCloud = useCallback(() => {
    if (!isSupabaseConfigured) return Promise.resolve();
    const snapshot = data;
    return enqueueCloudWrite(() => cloudSyncService.seed(snapshot))
      .then(() => showToast('All local data pushed to Supabase'))
      .catch((e) => markSyncError(e, 'Full upload failed'));
  }, [data, enqueueCloudWrite, markSyncError, showToast]);

  // Replace all data with an empty company ('empty') or the demo dataset ('demo')
  const resetAllData = useCallback(async (mode = 'demo') => {
    storageService.resetAll();
    const fresh = mode === 'empty' ? getEmptyData() : getSeedData();
    if (isSupabaseConfigured) {
      try {
        await enqueueCloudWrite(() => cloudSyncService.seed(fresh));
        syncedSnapshotRef.current = fresh;
      } catch (e) {
        markSyncError(e, 'Resetting the Supabase database failed');
        return;
      }
    }
    setData(fresh);
    showToast(
      mode === 'empty' ? 'All data deleted. You can now enter your company’s real data.' : 'Demo dataset loaded',
      'info'
    );
  }, [enqueueCloudWrite, markSyncError, showToast]);

  // ===================== MEDICINES ACTIONS =====================
  const addMedicine = useCallback((newMed) => {
    const id = nextSequentialId('MED-', data.medicines);
    const medicine = {
      ...newMed,
      id,
      purchasePrice: parseFloat(newMed.purchasePrice) || 0,
      sellingPrice: parseFloat(newMed.sellingPrice) || 0,
      minStockLevel: parseInt(newMed.minStockLevel, 10) || 100,
      maxStockLevel: parseInt(newMed.maxStockLevel, 10) || 1000,
      status: newMed.status || 'Active',
    };
    setData((prev) => ({
      ...prev,
      medicines: [medicine, ...prev.medicines],
    }));
    showToast(`Medicine "${medicine.name}" created successfully`);
    return medicine;
  }, [data.medicines, showToast]);

  const updateMedicine = useCallback((id, updated) => {
    setData((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) =>
        m.id === id
          ? {
              ...m,
              ...updated,
              purchasePrice: parseFloat(updated.purchasePrice) || m.purchasePrice,
              sellingPrice: parseFloat(updated.sellingPrice) || m.sellingPrice,
              minStockLevel: parseInt(updated.minStockLevel, 10) || m.minStockLevel,
              maxStockLevel: parseInt(updated.maxStockLevel, 10) || m.maxStockLevel,
            }
          : m
      ),
    }));
    showToast('Medicine details updated');
  }, [showToast]);

  const deleteMedicine = useCallback((id) => {
    // Check if batches exist
    const hasBatches = data.batches.some((b) => b.medicineId === id && b.availableQuantity > 0);
    if (hasBatches) {
      showToast('Cannot delete medicine with active inventory batches.', 'danger');
      return false;
    }
    setData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((m) => m.id !== id),
    }));
    showToast('Medicine removed from catalog', 'warning');
    return true;
  }, [data.batches, showToast]);

  // ===================== BATCHES & QUALITY ACTIONS =====================
  const updateBatchStatus = useCallback((batchId, newStatus) => {
    setData((prev) => {
      const batch = prev.batches.find((b) => b.id === batchId);
      const updatedBatches = prev.batches.map((b) =>
        b.id === batchId ? { ...b, qualityStatus: newStatus } : b
      );

      // Create a notification if quarantined or recalled
      let newNotifs = prev.notifications;
      if (newStatus === 'Quarantined' || newStatus === 'Recalled') {
        const notif = {
          id: `NOTIF-${Date.now()}`,
          title: `Batch ${newStatus} Action`,
          message: `Batch ${batch?.batchNumber || batchId} (${batch?.medicineName}) was marked as ${newStatus}. Sales are blocked.`,
          type: 'danger',
          timestamp: 'Just now',
          read: false,
          link: '/batches',
        };
        newNotifs = [notif, ...prev.notifications];
      }

      return {
        ...prev,
        batches: updatedBatches,
        notifications: newNotifs,
      };
    });
    showToast(`Batch status set to ${newStatus}`);
  }, [showToast]);

  // ===================== OPENING STOCK =====================
  const addOpeningStock = useCallback((entry) => {
    const medicine = data.medicines.find((m) => m.id === entry.medicineId);
    const warehouse = data.warehouses.find((w) => w.id === entry.warehouseId);
    if (!medicine || !warehouse) {
      showToast('Select a valid medicine and warehouse', 'danger');
      return false;
    }
    const duplicate = data.batches.some(
      (b) => b.batchNumber === entry.batchNumber && b.medicineId === entry.medicineId && b.warehouseId === entry.warehouseId
    );
    if (duplicate) {
      showToast(`Batch ${entry.batchNumber} already exists in ${warehouse.name}. Use a stock adjustment instead.`, 'danger', 5000);
      return false;
    }

    const quantity = Number(entry.quantity) || 0;
    const stamp = Date.now().toString(36).toUpperCase();
    const batch = {
      id: `BAT-${stamp}`,
      batchNumber: entry.batchNumber.trim(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      mfgDate: entry.mfgDate || '',
      expiryDate: entry.expiryDate,
      quantityReceived: quantity,
      availableQuantity: quantity,
      purchaseCost: Number(entry.unitCost) || medicine.purchasePrice || 0,
      warehouseId: warehouse.id,
      qualityStatus: 'Active',
    };
    const movement = {
      id: `MOV-${stamp}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'Opening stock',
      medicineName: medicine.name,
      batchNumber: batch.batchNumber,
      quantity,
      warehouseName: warehouse.name,
      reference: 'OPENING',
      performedBy: actor,
      notes: entry.notes || 'Opening stock entered at go-live',
    };
    setData((prev) => ({
      ...prev,
      batches: [batch, ...prev.batches],
      stockMovements: [movement, ...prev.stockMovements],
    }));
    showToast(`Opening stock added: ${quantity} × ${medicine.name} (${batch.batchNumber})`);
    return true;
  }, [actor, data.batches, data.medicines, data.warehouses, showToast]);

  // ===================== STOCK ADJUSTMENT & TRANSFER =====================
  const adjustStock = useCallback(({ batchId, quantityChange, reason, notes }) => {
    setData((prev) => {
      const batch = prev.batches.find((b) => b.id === batchId);
      if (!batch) return prev;

      const newQty = Math.max(0, (batch.availableQuantity || 0) + quantityChange);
      const wh = prev.warehouses.find((w) => w.id === batch.warehouseId);

      const movement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: 'Adjustment',
        medicineName: batch.medicineName,
        batchNumber: batch.batchNumber,
        quantity: quantityChange,
        warehouseName: wh ? wh.name : 'Warehouse',
        reference: `ADJ-${Date.now().toString().slice(-4)}`,
        performedBy: actor,
        notes: `Reason: ${reason}. ${notes || ''}`,
      };

      const updatedBatches = prev.batches.map((b) =>
        b.id === batchId ? { ...b, availableQuantity: newQty } : b
      );

      return {
        ...prev,
        batches: updatedBatches,
        stockMovements: [movement, ...prev.stockMovements],
      };
    });
    showToast('Stock quantity adjusted successfully');
  }, [actor, showToast]);

  const transferStock = useCallback(({ batchId, sourceWarehouseId, destWarehouseId, quantity, notes }) => {
    setData((prev) => {
      const sourceBatch = prev.batches.find((b) => b.id === batchId);
      if (!sourceBatch || sourceBatch.availableQuantity < quantity) {
        return prev;
      }

      const sourceWh = prev.warehouses.find((w) => w.id === sourceWarehouseId);
      const destWh = prev.warehouses.find((w) => w.id === destWarehouseId);

      // Deduct from source batch
      const updatedBatches = prev.batches.map((b) =>
        b.id === batchId ? { ...b, availableQuantity: b.availableQuantity - quantity } : b
      );

      // Check if destination warehouse already has this batch number
      const existingDestBatch = updatedBatches.find(
        (b) => b.batchNumber === sourceBatch.batchNumber && b.warehouseId === destWarehouseId
      );

      let finalBatches;
      if (existingDestBatch) {
        finalBatches = updatedBatches.map((b) =>
          b.id === existingDestBatch.id
            ? { ...b, availableQuantity: b.availableQuantity + quantity }
            : b
        );
      } else {
        const newBatchEntry = {
          ...sourceBatch,
          id: `BAT-TRF-${Date.now().toString().slice(-5)}`,
          warehouseId: destWarehouseId,
          availableQuantity: quantity,
          quantityReceived: quantity,
        };
        finalBatches = [...updatedBatches, newBatchEntry];
      }

      const refNo = `TRF-${Date.now().toString().slice(-5)}`;
      const movement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: 'Warehouse transfer',
        medicineName: sourceBatch.medicineName,
        batchNumber: sourceBatch.batchNumber,
        quantity: quantity,
        warehouseName: `${sourceWh?.name || 'Source'} → ${destWh?.name || 'Dest'}`,
        reference: refNo,
        performedBy: actor,
        notes: notes || `Inter-warehouse transfer of ${quantity} units`,
      };

      return {
        ...prev,
        batches: finalBatches,
        stockMovements: [movement, ...prev.stockMovements],
      };
    });
    showToast(`Successfully transferred ${quantity} units`);
  }, [actor, showToast]);

  // ===================== SUPPLIERS & PURCHASES =====================
  const addSupplier = useCallback((supplierData) => {
    const id = nextSequentialId('SUP-', data.suppliers);
    const supplier = {
      ...supplierData,
      id,
      creditDays: parseInt(supplierData.creditDays, 10) || 30,
      outstandingBalance: parseFloat(supplierData.outstandingBalance) || 0,
      totalPurchases: 0,
      rating: parseFloat(supplierData.rating) || 4.5,
      status: supplierData.status || 'Active',
    };
    setData((prev) => ({
      ...prev,
      suppliers: [supplier, ...prev.suppliers],
    }));
    showToast(`Supplier "${supplier.name}" added`);
    return supplier;
  }, [data.suppliers, showToast]);

  const updateSupplier = useCallback((id, updated) => {
    setData((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    }));
    showToast('Supplier updated');
  }, [showToast]);

  const createPurchaseOrder = useCallback((poData) => {
    const poNumber = `PO-2024-${String(data.purchaseOrders.length + 1).padStart(3, '0')}`;
    const id = poNumber;
    const initialStatus = poData.status || 'Pending Approval';

    const po = {
      id,
      poNumber,
      orderDate: poData.orderDate || new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: poData.expectedDeliveryDate,
      supplierId: poData.supplierId,
      supplierName: poData.supplierName,
      warehouseId: poData.warehouseId,
      warehouseName: poData.warehouseName,
      status: initialStatus, // Workflow: Draft -> Pending Approval -> Approved -> Received -> Completed
      paymentTerms: poData.paymentTerms || 'Net 30 Days',
      items: poData.items,
      subtotal: poData.subtotal,
      discountAmount: poData.discountAmount || 0,
      taxAmount: poData.taxAmount || 0,
      grandTotal: poData.grandTotal,
      notes: poData.notes || '',
      receivedDate: null,
    };

    const isDraft = initialStatus === 'Draft';
    const notifTitle = isDraft ? 'PO Saved as Draft' : 'New PO Pending Approval';
    const notifMsg = isDraft
      ? `Purchase order ${poNumber} for ${po.supplierName} saved as draft.`
      : `Purchase order ${poNumber} for ${po.supplierName} requires authorization.`;

    setData((prev) => ({
      ...prev,
      purchaseOrders: [po, ...prev.purchaseOrders],
      notifications: [
        {
          id: `NOTIF-${Date.now()}`,
          title: notifTitle,
          message: notifMsg,
          type: isDraft ? 'info' : 'warning',
          timestamp: 'Just now',
          read: false,
          link: '/purchases/orders',
        },
        ...prev.notifications,
      ],
    }));
    showToast(
      isDraft
        ? `Purchase order ${poNumber} saved as draft`
        : `Purchase order ${poNumber} created and submitted for approval`
    );
    return po;
  }, [data.purchaseOrders.length, showToast]);

  const updatePOStatus = useCallback((poId, newStatus) => {
    setData((prev) => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map((p) =>
        p.id === poId ? { ...p, status: newStatus } : p
      ),
    }));
    showToast(`PO ${poId} status set to ${newStatus}`);
  }, [showToast]);

  // GOODS RECEIVING (GRN) WORKFLOW
  const receiveGoods = useCallback(({ poId, receivingLines, notes }) => {
    setData((prev) => {
      const po = prev.purchaseOrders.find((p) => p.id === poId);
      if (!po) return prev;

      const newBatches = [...prev.batches];
      const newMovements = [...prev.stockMovements];
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      receivingLines.forEach((line) => {
        const med = prev.medicines.find((m) => m.id === line.medicineId);
        const batchId = `BAT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;

        const batch = {
          id: batchId,
          batchNumber: line.batchNumber || `BN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          medicineId: line.medicineId,
          medicineName: line.medicineName,
          mfgDate: line.mfgDate,
          expiryDate: line.expiryDate,
          quantityReceived: Number(line.quantity),
          availableQuantity: Number(line.quantity),
          purchaseCost: Number(line.unitCost),
          warehouseId: po.warehouseId,
          qualityStatus: 'Active',
        };
        newBatches.unshift(batch);

        newMovements.unshift({
          id: `MOV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
          timestamp: nowStr,
          type: 'Purchase receipt',
          medicineName: line.medicineName,
          batchNumber: batch.batchNumber,
          quantity: Number(line.quantity),
          warehouseName: po.warehouseName,
          reference: po.poNumber,
          performedBy: actor,
          notes: notes || `Goods received against PO ${po.poNumber}`,
        });
      });

      // Update PO status to Completed
      const updatedPOs = prev.purchaseOrders.map((p) =>
        p.id === poId ? { ...p, status: 'Completed', receivedDate: new Date().toISOString().slice(0, 10) } : p
      );

      // Increase supplier outstanding balance
      const updatedSuppliers = prev.suppliers.map((s) =>
        s.id === po.supplierId
          ? {
              ...s,
              outstandingBalance: (s.outstandingBalance || 0) + po.grandTotal,
              totalPurchases: (s.totalPurchases || 0) + po.grandTotal,
            }
          : s
      );

      return {
        ...prev,
        batches: newBatches,
        stockMovements: newMovements,
        purchaseOrders: updatedPOs,
        suppliers: updatedSuppliers,
      };
    });
    showToast(`Goods receiving completed for PO ${poId}. Batches & stock updated!`);
  }, [actor, showToast]);

  // ===================== CUSTOMERS & SALES =====================
  const addCustomer = useCallback((customerData) => {
    const id = nextSequentialId('CUST-', data.customers);
    const customer = {
      ...customerData,
      id,
      creditLimit: parseFloat(customerData.creditLimit) || 1000000,
      outstandingReceivables: parseFloat(customerData.openingBalance) || 0,
      openingBalance: parseFloat(customerData.openingBalance) || 0,
      openingBalanceDate: parseFloat(customerData.openingBalance) ? customerData.openingBalanceDate || new Date().toISOString().slice(0, 10) : null,
      status: customerData.status || 'Active',
    };
    setData((prev) => ({
      ...prev,
      customers: [customer, ...prev.customers],
    }));
    showToast(`Customer "${customer.name}" created`);
    return customer;
  }, [data.customers, showToast]);

  const updateCustomer = useCallback((id, updated) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
    showToast('Customer profile updated');
  }, [showToast]);

  // SALES ORDER WITH AUTOMATIC FEFO BATCH ALLOCATION
  const createSalesOrder = useCallback(({ orderData, confirmImmediately = true }) => {
    // Step 1: Validate stock & compute FEFO allocations for each item
    const warehouseId = orderData.warehouseId;
    const itemAllocations = [];
    const missingItems = [];

    orderData.items.forEach((item) => {
      const res = allocateBatchesFEFO({
        batches: data.batches,
        medicineId: item.medicineId,
        warehouseId,
        requestedQuantity: Number(item.quantity) + (Number(item.bonusQty) || 0),
      });

      if (!res.success) {
        missingItems.push({
          medicineName: item.medicineName,
          requested: Number(item.quantity) + (Number(item.bonusQty) || 0),
          available: res.totalEligible,
          reason: res.reason,
        });
      } else {
        itemAllocations.push({
          ...item,
          allocatedBatches: res.allocations,
        });
      }
    });

    if (missingItems.length > 0) {
      const errorMsg = missingItems
        .map((m) => `${m.medicineName}: requested ${m.requested}, only ${m.available} eligible units in stock.`)
        .join(' ');
      showToast(`Stock Validation Error: ${errorMsg}`, 'danger', 5000);
      return { success: false, error: errorMsg };
    }

    const year = new Date().getFullYear();
    const orderNumber = nextSequentialId(`SO-${year}-`, data.salesOrders, 4);
    const invoiceNumber = nextSequentialId(`INV-${year}-`, data.salesInvoices, 4);
    const orderCustomer = data.customers.find((c) => c.id === orderData.customerId);
    const salesRepId = orderData.salesRepId || orderCustomer?.salesRepId || null;

    const newOrder = {
      id: orderNumber,
      soNumber: orderNumber,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      salesRepId,
      territory: orderCustomer?.territory || null,
      warehouseId: orderData.warehouseId,
      warehouseName: orderData.warehouseName,
      orderDate: orderData.orderDate || new Date().toISOString().slice(0, 10),
      status: confirmImmediately ? 'Confirmed' : 'Draft',
      paymentStatus: 'Unpaid',
      items: itemAllocations,
      subtotal: orderData.subtotal,
      discountAmount: orderData.discountAmount || 0,
      taxAmount: orderData.taxAmount || 0,
      grandTotal: orderData.grandTotal,
      invoiceId: confirmImmediately ? invoiceNumber : null,
      notes: orderData.notes || '',
    };

    setData((prev) => {
      let updatedBatches = [...prev.batches];
      let newMovements = [...prev.stockMovements];
      let newInvoices = [...prev.salesInvoices];
      let updatedCustomers = [...prev.customers];
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      if (confirmImmediately) {
        // Deduct batch quantities
        itemAllocations.forEach((item) => {
          item.allocatedBatches.forEach((alloc) => {
            updatedBatches = updatedBatches.map((b) =>
              b.id === alloc.batchId
                ? { ...b, availableQuantity: Math.max(0, b.availableQuantity - alloc.quantity) }
                : b
            );

            // Log stock movement
            newMovements.unshift({
              id: `MOV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
              timestamp: nowStr,
              type: 'Sales issue',
              medicineName: item.medicineName,
              batchNumber: alloc.batchNumber,
              quantity: -alloc.quantity,
              warehouseName: orderData.warehouseName,
              reference: orderNumber,
              performedBy: actor,
              notes: `FEFO issue to ${orderData.customerName} (Exp: ${alloc.expiryDate})`,
            });
          });
        });

        // Create Invoice
        const customer = prev.customers.find((c) => c.id === orderData.customerId);
        const invoice = {
          id: invoiceNumber,
          invoiceNumber,
          orderId: orderNumber,
          orderNumber,
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          customerTaxId: customer?.taxRegistrationNumber || 'N/A',
          customerLicense: customer?.drugLicenseNumber || '',
          customerAddress: customer?.address || '',
          salesRepId,
          invoiceDate: newOrder.orderDate,
          dueDate: new Date(Date.now() + (customer?.creditDays || 30) * 24 * 3600 * 1000).toISOString().slice(0, 10),
          subtotal: orderData.subtotal,
          discountAmount: orderData.discountAmount || 0,
          taxAmount: orderData.taxAmount || 0,
          grandTotal: orderData.grandTotal,
          paidAmount: 0,
          balanceDue: orderData.grandTotal,
          paymentStatus: 'Unpaid',
          warehouseName: orderData.warehouseName,
          items: itemAllocations.map((it) => ({
            medicineName: it.medicineName,
            genericName: it.genericName || it.medicineName,
            batchNumber: it.allocatedBatches.map((b) => b.batchNumber).join(', '),
            expiryDate: it.allocatedBatches.map((b) => b.expiryDate).join(', '),
            quantity: it.quantity,
            bonusQty: Number(it.bonusQty) || 0,
            unitPrice: it.unitPrice,
            retailPrice: it.retailPrice,
            discountPercent: it.discountPercent || 0,
            taxPercent: it.taxPercent || 0,
            total: it.total,
          })),
        };
        newInvoices.unshift(invoice);

        // Update customer outstanding balance
        updatedCustomers = updatedCustomers.map((c) =>
          c.id === orderData.customerId
            ? { ...c, outstandingReceivables: (c.outstandingReceivables || 0) + orderData.grandTotal }
            : c
        );
      }

      return {
        ...prev,
        salesOrders: [newOrder, ...prev.salesOrders],
        salesInvoices: newInvoices,
        batches: updatedBatches,
        stockMovements: newMovements,
        customers: updatedCustomers,
      };
    });

    showToast(`Sales Order ${orderNumber} created and confirmed with FEFO allocations!`);
    return { success: true, order: newOrder, invoiceId: confirmImmediately ? invoiceNumber : null };
  }, [actor, data.batches, data.customers, data.salesInvoices, data.salesOrders, showToast]);

  // SALES RETURN PROCESSOR
  const createSalesReturn = useCallback((returnData) => {
    const returnNumber = `SR-2024-${String(data.salesReturns.length + 1).padStart(3, '0')}`;
    const id = returnNumber;

    const returnRecord = {
      id,
      returnNumber,
      invoiceNumber: returnData.invoiceNumber,
      customerId: returnData.customerId,
      customerName: returnData.customerName,
      date: new Date().toISOString().slice(0, 10),
      medicineId: returnData.medicineId,
      medicineName: returnData.medicineName,
      batchNumber: returnData.batchNumber,
      quantity: Number(returnData.quantity),
      unitPrice: Number(returnData.unitPrice),
      refundAmount: Number(returnData.quantity) * Number(returnData.unitPrice),
      reason: returnData.reason,
      destination: returnData.destination || 'Quarantine Stock', // Quarantine or Active
      status: 'Processed',
    };

    setData((prev) => {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // If returning to active or quarantine, update or create batch
      const updatedBatches = prev.batches.map((b) => {
        if (b.batchNumber === returnData.batchNumber) {
          return {
            ...b,
            availableQuantity: b.availableQuantity + returnRecord.quantity,
            qualityStatus: returnRecord.destination === 'Quarantine Stock' ? 'Quarantined' : b.qualityStatus,
          };
        }
        return b;
      });

      const movement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        timestamp: nowStr,
        type: 'Sales return',
        medicineName: returnRecord.medicineName,
        batchNumber: returnRecord.batchNumber,
        quantity: returnRecord.quantity,
        warehouseName: 'Central Logistics Hub (Warehouse A)',
        reference: returnNumber,
        performedBy: actor,
        notes: `Returned: ${returnRecord.reason} -> ${returnRecord.destination}`,
      };

      // Reduce customer receivables
      const updatedCustomers = prev.customers.map((c) =>
        c.id === returnData.customerId
          ? {
              ...c,
              outstandingReceivables: Math.max(0, (c.outstandingReceivables || 0) - returnRecord.refundAmount),
            }
          : c
      );

      return {
        ...prev,
        salesReturns: [returnRecord, ...prev.salesReturns],
        batches: updatedBatches,
        stockMovements: [movement, ...prev.stockMovements],
        customers: updatedCustomers,
      };
    });

    showToast(`Sales return ${returnNumber} processed and stock accounted.`);
    return returnRecord;
  }, [actor, data.salesReturns.length, showToast]);

  // ===================== PAYMENTS & EXPENSES =====================
  const recordCustomerPayment = useCallback((payData) => {
    const id = `PAY-CUST-${Date.now().toString().slice(-5)}`;
    const payment = {
      id,
      type: 'Customer Payment',
      partyId: payData.customerId,
      partyName: payData.customerName,
      salesRepId: data.customers.find((c) => c.id === payData.customerId)?.salesRepId || null,
      date: payData.date || new Date().toISOString().slice(0, 10),
      amount: parseFloat(payData.amount),
      paymentMethod: payData.paymentMethod || 'Bank Transfer',
      referenceNumber: payData.referenceNumber || `REF-${Date.now().toString().slice(-5)}`,
      invoiceReference: payData.invoiceNumber || 'General Account',
      notes: payData.notes || '',
    };

    setData((prev) => {
      // Reduce customer balance
      const updatedCustomers = prev.customers.map((c) =>
        c.id === payData.customerId
          ? { ...c, outstandingReceivables: Math.max(0, (c.outstandingReceivables || 0) - payment.amount) }
          : c
      );

      // If specific invoice referenced, update its paid amount
      const updatedInvoices = prev.salesInvoices.map((inv) => {
        if (inv.invoiceNumber === payData.invoiceNumber) {
          const newPaid = (inv.paidAmount || 0) + payment.amount;
          const newBalance = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid';
          return {
            ...inv,
            paidAmount: newPaid,
            balanceDue: newBalance,
            paymentStatus: newStatus,
          };
        }
        return inv;
      });

      return {
        ...prev,
        payments: [payment, ...prev.payments],
        customers: updatedCustomers,
        salesInvoices: updatedInvoices,
      };
    });

    showToast(`Payment of Rs. ${payment.amount.toLocaleString()} recorded for ${payData.customerName}`);
  }, [data.customers, showToast]);

  const recordSupplierPayment = useCallback((payData) => {
    const id = `PAY-SUP-${Date.now().toString().slice(-5)}`;
    const payment = {
      id,
      type: 'Supplier Payment',
      partyId: payData.supplierId,
      partyName: payData.supplierName,
      date: payData.date || new Date().toISOString().slice(0, 10),
      amount: parseFloat(payData.amount),
      paymentMethod: payData.paymentMethod || 'Bank Transfer',
      referenceNumber: payData.referenceNumber || `REF-${Date.now().toString().slice(-5)}`,
      invoiceReference: payData.poNumber || 'General Account',
      notes: payData.notes || '',
    };

    setData((prev) => {
      // Reduce supplier outstanding balance
      const updatedSuppliers = prev.suppliers.map((s) =>
        s.id === payData.supplierId
          ? { ...s, outstandingBalance: Math.max(0, (s.outstandingBalance || 0) - payment.amount) }
          : s
      );

      return {
        ...prev,
        payments: [payment, ...prev.payments],
        suppliers: updatedSuppliers,
      };
    });

    showToast(`Supplier payment of Rs. ${payment.amount.toLocaleString()} dispatched`);
  }, [showToast]);

  const addExpense = useCallback((expData) => {
    const id = `EXP-${Date.now().toString().slice(-5)}`;
    const expense = {
      id,
      date: expData.date || new Date().toISOString().slice(0, 10),
      category: expData.category || 'Operations',
      title: expData.title,
      amount: parseFloat(expData.amount) || 0,
      paymentMethod: expData.paymentMethod || 'Bank Transfer',
      referenceNumber: expData.referenceNumber || `REF-${Date.now().toString().slice(-4)}`,
      approvedBy: actor,
      notes: expData.notes || '',
    };

    setData((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
    showToast(`Expense "${expense.title}" logged`);
  }, [actor, showToast]);

  // ===================== EMPLOYEES =====================
  const addEmployee = useCallback((empData) => {
    const id = nextSequentialId('EMP-', data.employees);
    const emp = {
      id,
      ...empData,
      joinDate: empData.joinDate || new Date().toISOString().slice(0, 10),
      status: empData.status || 'Active',
    };
    setData((prev) => ({
      ...prev,
      employees: [emp, ...prev.employees],
    }));
    showToast(`Employee ${emp.fullName} registered`);
  }, [data.employees, showToast]);

  const updateEmployee = useCallback((id, updated) => {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    }));
    showToast('Employee information updated');
  }, [showToast]);

  // ===================== SETTINGS & NOTIFICATIONS =====================
  const updateCompanyProfile = useCallback((profile) => {
    setData((prev) => ({ ...prev, companyProfile: { ...prev.companyProfile, ...profile } }));
    showToast('Company profile updated');
  }, [showToast]);

  const addWarehouse = useCallback((whData) => {
    const id = nextSequentialId('WH-', data.warehouses, 2);
    const wh = {
      id,
      ...whData,
      capacitySqFt: parseInt(whData.capacitySqFt, 10) || 0,
      utilizationPercent: 0,
      status: 'Active',
    };
    setData((prev) => ({
      ...prev,
      warehouses: [...prev.warehouses, wh],
    }));
    showToast(`Warehouse "${wh.name}" registered`);
  }, [data.warehouses, showToast]);

  const addCategory = useCallback((catName) => {
    if (!catName || data.categories.includes(catName)) return;
    setData((prev) => ({ ...prev, categories: [...prev.categories, catName] }));
    showToast(`Category "${catName}" added`);
  }, [data.categories, showToast]);

  const addUnit = useCallback((unitName) => {
    if (!unitName || data.units.includes(unitName)) return;
    setData((prev) => ({ ...prev, units: [...prev.units, unitName] }));
    showToast(`Unit of measure "${unitName}" added`);
  }, [data.units, showToast]);

  const markNotificationRead = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    showToast('All notifications marked as read');
  }, [showToast]);

  // ===================== DERIVED METRICS =====================
  const metrics = useMemo(() => {
    const filteredBatches =
      currentWarehouseId === 'ALL'
        ? data.batches
        : data.batches.filter((b) => b.warehouseId === currentWarehouseId);

    // Total Stock Quantity across filtered batches
    const totalStockQuantity = filteredBatches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);

    // Total Inventory Valuation (sum of availableQuantity * purchaseCost)
    const totalInventoryValue = filteredBatches.reduce(
      (acc, b) => acc + (b.availableQuantity || 0) * (b.purchaseCost || 0),
      0
    );

    // Medicines with stock aggregated
    const medicineStockMap = {};
    filteredBatches.forEach((b) => {
      medicineStockMap[b.medicineId] = (medicineStockMap[b.medicineId] || 0) + (b.availableQuantity || 0);
    });

    // Low stock items
    const lowStockItems = data.medicines.filter((m) => {
      const stock = medicineStockMap[m.id] || 0;
      return stock <= m.minStockLevel;
    });

    // Near expiry batches
    const nearExpiryBatches = filteredBatches.filter((b) => {
      const status = evaluateBatchStatus(b);
      return status === 'Near Expiry' && b.availableQuantity > 0;
    });

    // Expired batches
    const expiredBatches = filteredBatches.filter((b) => {
      const status = evaluateBatchStatus(b);
      return status === 'Expired' && b.availableQuantity > 0;
    });

    // Quarantined/Recalled
    const quarantinedBatches = filteredBatches.filter(
      (b) => (b.qualityStatus === 'Quarantined' || b.qualityStatus === 'Recalled') && b.availableQuantity > 0
    );

    // Outstanding Receivables
    const totalReceivables = data.customers.reduce((acc, c) => acc + (c.outstandingReceivables || 0), 0);

    // Outstanding Payables
    const totalPayables = data.suppliers.reduce((acc, s) => acc + (s.outstandingBalance || 0), 0);

    // Pending Purchase Orders
    const pendingPOs = data.purchaseOrders.filter((p) => p.status === 'Pending Approval' || p.status === 'Draft');

    // Today's Sales
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySales = data.salesOrders
      .filter((so) => so.orderDate === todayStr && so.status !== 'Draft')
      .reduce((acc, so) => acc + (so.grandTotal || 0), 0);

    // Total Sales all time
    const totalSalesAllTime = data.salesOrders
      .filter((so) => so.status !== 'Draft')
      .reduce((acc, so) => acc + (so.grandTotal || 0), 0);

    // Total Purchases all time
    const totalPurchasesAllTime = data.purchaseOrders
      .filter((po) => po.status === 'Completed' || po.status === 'Approved')
      .reduce((acc, po) => acc + (po.grandTotal || 0), 0);

    // Total Expenses all time
    const totalExpenses = data.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Invoices past their due date with a balance outstanding
    const overdueInvoiceCount = data.salesInvoices.filter(
      (inv) => (inv.balanceDue || 0) > 0 && inv.dueDate && inv.dueDate < todayStr
    ).length;

    return {
      totalMedicines: data.medicines.length,
      totalStockQuantity,
      totalInventoryValue,
      todaySales,
      totalSalesAllTime,
      totalPurchasesAllTime,
      totalExpenses,
      pendingPOCount: pendingPOs.length,
      overdueInvoiceCount,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      nearExpiryCount: nearExpiryBatches.length,
      nearExpiryBatches,
      expiredBatches,
      quarantinedBatches,
      totalReceivables,
      totalPayables,
      medicineStockMap,
    };
  }, [currentWarehouseId, data]);

  const value = {
    data,
    currentWarehouseId,
    setCurrentWarehouseId,
    currentUserRole,
    currentUser: user,
    isSearchOpen,
    setIsSearchOpen,
    toasts,
    showToast,
    removeToast,
    resetAllData,
    dataSource,
    syncState,
    refreshFromCloud,
    pushAllToCloud,
    metrics,
    // Actions
    addMedicine,
    updateMedicine,
    deleteMedicine,
    updateBatchStatus,
    adjustStock,
    transferStock,
    addOpeningStock,
    addSupplier,
    updateSupplier,
    createPurchaseOrder,
    updatePOStatus,
    receiveGoods,
    addCustomer,
    updateCustomer,
    createSalesOrder,
    createSalesReturn,
    recordCustomerPayment,
    recordSupplierPayment,
    addExpense,
    addEmployee,
    updateEmployee,
    updateCompanyProfile,
    addWarehouse,
    addCategory,
    addUnit,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <PharmaContext.Provider value={value}>{children}</PharmaContext.Provider>;
}

export function usePharma() {
  const context = useContext(PharmaContext);
  if (!context) {
    throw new Error('usePharma must be used within a PharmaProvider');
  }
  return context;
}
