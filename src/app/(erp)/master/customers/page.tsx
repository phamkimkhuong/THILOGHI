"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  Truck,
  RefreshCw,
  CheckCircle2,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  X,
  CreditCard,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { getCustomersAndVendorsAction } from "@/features/master-data/actions";

interface CustomerRecord {
  customerId: string;
  customerName: string;
  shortName?: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
  status: string;
  createdAt: string;
}

interface VendorRecord {
  vendorId: string;
  vendorName: string;
  vendorType: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  status: string;
  createdAt: string;
}

export default function MasterCustomersPage() {
  const [activeTab, setActiveTab] = useState<"CUSTOMERS" | "VENDORS">("CUSTOMERS");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentTermsFilter, setPaymentTermsFilter] = useState("ALL");

  // Drawer state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(() => {
    startTransition(async () => {
      const res = await getCustomersAndVendorsAction();
      if (res.success) {
        setCustomers((res.customers || []) as CustomerRecord[]);
        setVendors((res.vendors || []) as VendorRecord[]);
      }
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Instant Filter for Customers
  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          (c.shortName && c.shortName.toLowerCase().includes(q)) ||
          (c.taxCode && c.taxCode.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          c.customerId.toLowerCase().includes(q)
      );
    }
    if (paymentTermsFilter !== "ALL") {
      const days = Number(paymentTermsFilter);
      list = list.filter((c) => (c.paymentTermsDays || 30) === days);
    }
    return list;
  }, [customers, searchTerm, paymentTermsFilter]);

  // Instant Filter for Vendors
  const filteredVendors = useMemo(() => {
    let list = [...vendors];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(q) ||
          v.vendorType.toLowerCase().includes(q) ||
          (v.taxCode && v.taxCode.toLowerCase().includes(q)) ||
          v.vendorId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vendors, searchTerm]);

  const handleOpenCustomerDrawer = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setSelectedVendor(null);
    setIsDrawerOpen(true);
  };

  const handleOpenVendorDrawer = (vendor: VendorRecord) => {
    setSelectedVendor(vendor);
    setSelectedCustomer(null);
    setIsDrawerOpen(true);
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              COMMERCIAL PARTNERS DIRECTORY
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Tổng số: <strong>{customers.length + vendors.length}</strong> đối tác thương mại
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            Danh Mục Khách Hàng & Nhà Cung Cấp
          </h1>
          <p className="text-xs text-slate-400">
            Quản trị đối tác thương mại (SELL) và nhà xe vận tải (BUY) chuẩn hóa từ CSDL THILOGI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <Link
            href="/quotations/new"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Lập Báo Giá
          </Link>
        </div>
      </div>

      {/* Tabs and Instant Search */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => {
              setActiveTab("CUSTOMERS");
              setSearchTerm("");
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === "CUSTOMERS"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Khách Hàng ({filteredCustomers.length} / {customers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("VENDORS");
              setSearchTerm("");
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === "VENDORS"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Nhà Xe / Đối Tác Vận Tải ({filteredVendors.length} / {vendors.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {activeTab === "CUSTOMERS" && (
            <select
              value={paymentTermsFilter}
              onChange={(e) => setPaymentTermsFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất Cả Hạn Nợ</option>
              <option value="30">30 Ngày</option>
              <option value="45">45 Ngày</option>
              <option value="60">60 Ngày</option>
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === "CUSTOMERS" ? "Tìm theo tên, MST, mã KH..." : "Tìm nhà xe, loại hình..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {activeTab === "CUSTOMERS" ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Mã Khách Hàng</th>
                  <th className="py-2.5 px-3">Tên Doanh Nghiệp</th>
                  <th className="py-2.5 px-3">Tên Viết Tắt</th>
                  <th className="py-2.5 px-3">Mã Số Thuế</th>
                  <th className="py-2.5 px-3">Địa Chỉ Trụ Sở</th>
                  <th className="py-2.5 px-3 text-center">Hạn Nợ</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Không tìm thấy khách hàng phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.customerId}
                      onClick={() => handleOpenCustomerDrawer(c)}
                      className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-[11px] whitespace-nowrap">
                        <span className="text-blue-400 hover:underline">{c.customerId}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-100 max-w-[260px] truncate" title={c.customerName}>
                        {c.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {c.shortName || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {c.taxCode || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[240px] truncate" title={c.address}>
                        {c.address || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                        {c.paymentTermsDays ? `${c.paymentTermsDays} ngày` : "30 ngày"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/quotations/new?customerId=${c.customerId}`}
                          className="px-2 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <PlusCircle className="w-3 h-3" /> Lập Báo Giá
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Mã Nhà Xe / NCC</th>
                  <th className="py-2.5 px-3">Tên Nhà Xe / Đơn Vị</th>
                  <th className="py-2.5 px-3">Loại Hình Dịch Vụ</th>
                  <th className="py-2.5 px-3">Mã Số Thuế</th>
                  <th className="py-2.5 px-3">Số Điện Thoại</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Không tìm thấy nhà xe / đối tác phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr
                      key={v.vendorId}
                      onClick={() => handleOpenVendorDrawer(v)}
                      className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-[11px] whitespace-nowrap">
                        <span className="text-blue-400 hover:underline">{v.vendorId}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-100 max-w-[280px]">
                        {v.vendorName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-cyan-400">
                          {v.vendorType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {v.taxCode || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {v.phone || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> {v.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/rates?vendorId=${v.vendorId}`}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          Xem Tuyến Cước <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Drawer Detail */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-5 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {selectedCustomer ? (
                    <Building2 className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Truck className="w-5 h-5 text-cyan-400" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedCustomer ? "Hồ Sơ Khách Hàng" : "Hồ Sơ Nhà Xe / Đối Tác"}
                    </h3>
                    <span className="font-mono text-xs text-slate-400">
                      {selectedCustomer?.customerId || selectedVendor?.vendorId}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedCustomer && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tên công ty / Tổ chức:</span>
                      <strong className="text-sm text-slate-100 block mt-0.5">
                        {selectedCustomer.customerName}
                      </strong>
                    </div>
                    {selectedCustomer.shortName && (
                      <div>
                        <span className="text-[11px] text-slate-500 block">Tên viết tắt:</span>
                        <span className="text-slate-300 font-mono">{selectedCustomer.shortName}</span>
                      </div>
                    )}
                    {selectedCustomer.taxCode && (
                      <div>
                        <span className="text-[11px] text-slate-500 block">Mã số thuế:</span>
                        <span className="text-slate-300 font-mono font-bold">{selectedCustomer.taxCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>{selectedCustomer.address || "Chưa cập nhật địa chỉ"}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-mono">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-sans flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Hạn nợ thương mại:
                      </span>
                      <strong className="text-white">
                        {selectedCustomer.paymentTermsDays || 30} ngày
                      </strong>
                    </div>
                    {selectedCustomer.creditLimit && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" /> Hạn mức tín dụng:
                        </span>
                        <strong className="text-emerald-400">
                          {formatVND(selectedCustomer.creditLimit)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedVendor && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Đơn vị vận tải / Nhà cung cấp:</span>
                      <strong className="text-sm text-slate-100 block mt-0.5">
                        {selectedVendor.vendorName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Phân loại dịch vụ:</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-mono text-[11px] inline-block mt-0.5">
                        {selectedVendor.vendorType}
                      </span>
                    </div>
                    {selectedVendor.taxCode && (
                      <div>
                        <span className="text-[11px] text-slate-500 block">Mã số thuế:</span>
                        <span className="text-slate-300 font-mono font-bold">{selectedVendor.taxCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    {selectedVendor.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-mono">{selectedVendor.phone}</span>
                      </div>
                    )}
                    {selectedVendor.email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{selectedVendor.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Đóng
              </button>
              {selectedCustomer && (
                <Link
                  href={`/quotations/new?customerId=${selectedCustomer.customerId}`}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Lập Báo Giá
                </Link>
              )}
              {selectedVendor && (
                <Link
                  href={`/rates?vendorId=${selectedVendor.vendorId}`}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Xem Tuyến Cước
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
