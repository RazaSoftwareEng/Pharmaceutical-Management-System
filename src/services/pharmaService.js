// src/services/pharmaService.js
// Pharmaceutical Business Logic & Future Backend Service Interface

/**
 * Evaluates the current quality status of a batch based on expiry date
 * Preserves 'Quarantined' or 'Recalled' status set by Quality Assurance
 */
export function evaluateBatchStatus(batch) {
  if (batch.qualityStatus === 'Quarantined' || batch.qualityStatus === 'Recalled') {
    return batch.qualityStatus;
  }
  const today = new Date();
  const expiry = new Date(batch.expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Expired';
  }
  if (diffDays <= 90) {
    return 'Near Expiry';
  }
  return 'Active';
}

/**
 * FEFO (First Expiry, First Out) Batch Allocation Engine
 * Rules:
 * 1. Strictly filters out Expired, Quarantined, and Recalled batches.
 * 2. Only considers Active and Near Expiry batches with availableQuantity > 0.
 * 3. Sorts candidate batches by earliest expiry date first.
 * 4. Allocates batch quantities incrementally until requested quantity is satisfied.
 */
export function allocateBatchesFEFO({ batches, medicineId, warehouseId = null, requestedQuantity }) {
  // Step 1: Filter eligible batches
  const eligibleBatches = batches.filter((b) => {
    if (b.medicineId !== medicineId) return false;
    if (warehouseId && warehouseId !== 'ALL' && b.warehouseId !== warehouseId) return false;

    // Disallow Expired, Quarantined, or Recalled
    const currentStatus = evaluateBatchStatus(b);
    if (currentStatus === 'Expired' || currentStatus === 'Quarantined' || currentStatus === 'Recalled') {
      return false;
    }
    return (b.availableQuantity || 0) > 0;
  });

  // Step 2: Sort by Expiry Date Ascending (FEFO)
  eligibleBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // Step 3: Calculate total eligible stock
  const totalEligible = eligibleBatches.reduce((acc, b) => acc + b.availableQuantity, 0);

  if (totalEligible < requestedQuantity) {
    return {
      success: false,
      reason: `Insufficient eligible stock. Requested: ${requestedQuantity}, Eligible available: ${totalEligible}`,
      totalEligible,
      allocations: [],
    };
  }

  // Step 4: Allocate
  let remainingNeeded = requestedQuantity;
  const allocations = [];

  for (const batch of eligibleBatches) {
    if (remainingNeeded <= 0) break;
    const take = Math.min(batch.availableQuantity, remainingNeeded);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      warehouseId: batch.warehouseId,
      quantity: take,
      unitCost: batch.purchaseCost,
    });
    remainingNeeded -= take;
  }

  return {
    success: true,
    totalEligible,
    allocations,
  };
}

/**
 * Formats currency in consistent PKR format
 */
export function formatCurrency(amount, currency = 'Rs.') {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currency} 0.00`;
  return `${currency} ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Short currency in the South Asian system: Rs. 31.62 Lakh, Rs. 1.25 Cr, Rs. 95K
 */
export function formatCompactCurrency(amount, currency = 'Rs.') {
  const n = Number(amount) || 0;
  const abs = Math.abs(n);
  const prefix = currency ? `${currency} ` : '';
  const scaled = (size, suffix) => {
    const v = n / size;
    const digits = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
    return `${prefix}${Number(v.toFixed(digits))}${suffix}`;
  };
  if (abs >= 1e7) return scaled(1e7, ' Cr');
  if (abs >= 1e5) return scaled(1e5, ' Lakh');
  if (abs >= 1e3) return scaled(1e3, 'K');
  return `${prefix}${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Free units under a trade scheme, e.g. { buyQty: 10, freeQty: 1 } on 50 billed = 5 bonus.
 */
export function calculateBonus(scheme, quantity) {
  if (!scheme || !scheme.buyQty) return 0;
  return Math.floor((Number(quantity) || 0) / scheme.buyQty) * (scheme.freeQty || 0);
}

export function formatScheme(scheme) {
  return scheme && scheme.buyQty ? `${scheme.buyQty}+${scheme.freeQty}` : '';
}

/**
 * wa.me link for a Pakistani or international number. Local numbers like
 * 0300-1234567 are converted to 92300...; returns null for unusable numbers.
 */
export function buildWhatsAppLink(phone, message) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Percentage change between two values; null when there is no baseline.
 */
export function percentChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Calculates days until expiration
 */
export function getDaysUntilExpiry(expiryDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
}

/**
 * Exports JSON array to CSV and triggers browser download
 */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
