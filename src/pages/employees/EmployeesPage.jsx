// src/pages/employees/EmployeesPage.jsx
import React, { useState, useMemo } from 'react';
import { UserCheck, Plus, Search, Filter, Eye, Edit, ShieldCheck, Mail, Phone } from 'lucide-react';
import { usePharma } from '../../context/PharmaContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import EmployeeFormModal from './EmployeeFormModal';

export default function EmployeesPage() {
  const { data } = usePharma();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  const departments = [
    'Inventory & Warehousing',
    'Quality Assurance',
    'Sales & Distribution',
    'Finance & Accounts',
    'Warehouse Operations',
  ];

  const filteredEmployees = useMemo(() => {
    return data.employees.filter((emp) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        emp.fullName.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q);

      const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [data.employees, searchTerm, departmentFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Personnel & Staff Directory</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredEmployees.length} staff
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered pharmacists, warehouse controllers, accounts officers, and commercial directors.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEmployeeToEdit(null);
            setIsFormOpen(true);
          }}
        >
          Enroll Employee
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, designation, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {paginatedEmployees.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No personnel found"
            description="Adjust your search criteria or register a new team member."
            actionLabel="Enroll Employee"
            onAction={() => {
              setEmployeeToEdit(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Staff Member</th>
                  <th className="py-3 px-3 font-semibold">Department</th>
                  <th className="py-3 px-3 font-semibold">Designation</th>
                  <th className="py-3 px-3 font-semibold">ERP Role</th>
                  <th className="py-3 px-3 font-semibold">Contact Email</th>
                  <th className="py-3 px-3 font-semibold">Phone</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                          {emp.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{emp.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-700">{emp.department}</td>

                    <td className="py-3 px-3 font-medium text-slate-800">{emp.designation}</td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                        {emp.role}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{emp.email}</td>

                    <td className="py-3 px-3 text-slate-500">{emp.phone}</td>

                    <td className="py-3 px-3 text-center">
                      <Badge status={emp.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => {
                          setEmployeeToEdit(emp);
                          setIsFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEmployees.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
}
