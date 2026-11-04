import ExcelJS from "exceljs";

export interface QuotationExportData {
  quotationNo: string;
  version: number;
  customerName: string;
  taxCode?: string | null;
  address?: string | null;
  commodity?: string | null;
  paymentTermsDays: number;
  approvedAt?: string | null;
  currency: string;
  totalSellAmount: number;
  items: Array<{
    service: string;
    origin: string;
    destination: string;
    equipment: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
    inclusion: string;
  }>;
}

const inclusionLabels: Record<string, string> = {
  INCLUDED: "Trong giá chào",
  SEPARATELY_BILLED: "Thu riêng",
  PASS_THROUGH_ACTUAL: "Thu theo thực tế (tạm tính)",
};

/**
 * Xuất Báo giá THILOGI ra file Excel (.xlsx) chuẩn biểu mẫu doanh nghiệp
 */
export async function exportQuotationToExcel(data: QuotationExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "THILOGI ERP System";
  workbook.lastModifiedBy = "THILOGI Logistics";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`Báo giá ${data.quotationNo}`, {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    views: [{ showGridLines: true }],
  });

  // 1. TẬP ĐOÀN THILOGI Header
  worksheet.mergeCells("A1:H1");
  const compCell = worksheet.getCell("A1");
  compCell.value = "TẬP ĐOÀN THILOGI • TRUNG TÂM LOGISTICS QUỐC TẾ CHU LAI";
  compCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF102F63" } };
  compCell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.mergeCells("A2:H2");
  const subCompCell = worksheet.getCell("A2");
  subCompCell.value = "Khu Kinh tế Mở Chu Lai, Tam Hiệp, Núi Thành, Quảng Nam • Hotline: 1900 5454";
  subCompCell.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF647895" } };

  // 2. Tiêu đề Báo giá
  worksheet.mergeCells("A4:H4");
  const titleCell = worksheet.getCell("A4");
  titleCell.value = "BẢNG BÁO GIÁ DỊCH VỤ VẬN TẢI & LOGISTICS";
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF102F63" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  worksheet.mergeCells("A5:H5");
  const codeCell = worksheet.getCell("A5");
  codeCell.value = `Số báo giá: ${data.quotationNo}  |  Phiên bản: v${data.version}  |  Ngày lập: ${new Date().toLocaleDateString("vi-VN")}`;
  codeCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF2672DF" } };
  codeCell.alignment = { vertical: "middle", horizontal: "center" };

  // 3. Thông tin Khách hàng
  worksheet.addRow([]);
  const r7 = worksheet.addRow(["Kính gửi:", data.customerName, "", "", "Mã số thuế:", data.taxCode || "—"]);
  r7.getCell(1).font = { bold: true };
  r7.getCell(5).font = { bold: true };

  const r8 = worksheet.addRow(["Địa chỉ:", data.address || "—", "", "", "Hàng hóa:", data.commodity || "Hàng thông thường"]);
  r8.getCell(1).font = { bold: true };
  r8.getCell(5).font = { bold: true };

  const r9 = worksheet.addRow(["Hạn thanh toán:", `${data.paymentTermsDays} ngày`, "", "", "Đơn vị tiền tệ:", data.currency || "VND"]);
  r9.getCell(1).font = { bold: true };
  r9.getCell(5).font = { bold: true };

  worksheet.addRow([]);

  // 4. Bảng chi tiết dịch vụ
  const headerRow = worksheet.addRow([
    "STT",
    "Gói Dịch vụ / Tuyến Vận chuyển",
    "Thiết bị",
    "Số lượng",
    "Đơn vị",
    "Đơn giá (VND)",
    "Thành tiền (VND)",
    "Hình thức tính phí",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF102F63" }, // THILOGI Deep Navy
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2EAF4" } },
      left: { style: "thin", color: { argb: "FFE2EAF4" } },
      bottom: { style: "thin", color: { argb: "FFE2EAF4" } },
      right: { style: "thin", color: { argb: "FFE2EAF4" } },
    };
  });
  headerRow.height = 28;

  // Dữ liệu dòng
  data.items.forEach((item, index) => {
    const serviceName = item.service === "TRUCKING" ? "Vận tải đường bộ" : item.service;
    const row = worksheet.addRow([
      index + 1,
      `${serviceName}: ${item.origin} → ${item.destination}`,
      item.equipment,
      item.quantity,
      item.unit,
      item.unitPrice,
      item.amount,
      inclusionLabels[item.inclusion] || item.inclusion,
    ]);

    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(7).alignment = { horizontal: "right", vertical: "middle" };
    row.getCell(8).alignment = { horizontal: "center", vertical: "middle" };

    // Format tiền tệ
    row.getCell(4).numFmt = "#,##0.00";
    row.getCell(6).numFmt = '#,##0 "₫"';
    row.getCell(7).numFmt = '#,##0 "₫"';

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFEDF1F6" } },
        left: { style: "thin", color: { argb: "FFEDF1F6" } },
        bottom: { style: "thin", color: { argb: "FFEDF1F6" } },
        right: { style: "thin", color: { argb: "FFEDF1F6" } },
      };
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFD" },
        };
      }
    });
    row.height = 22;
  });

  // Dòng Tổng Cộng
  const totalRow = worksheet.addRow([
    "",
    "TỔNG CỘNG GIÁ TRỊ CHÀO / TẠM TÍNH (VND)",
    "",
    "",
    "",
    "",
    data.totalSellAmount,
    "",
  ]);

  worksheet.mergeCells(`B${totalRow.number}:F${totalRow.number}`);
  const totalLabel = totalRow.getCell(2);
  totalLabel.alignment = { horizontal: "right", vertical: "middle" };
  totalLabel.font = { name: "Calibri", bold: true, size: 10, color: { argb: "FF102F63" } };

  const totalValue = totalRow.getCell(7);
  totalValue.numFmt = '#,##0 "₫"';
  totalValue.font = { name: "Calibri", bold: true, size: 11, color: { argb: "FF2672DF" } };
  totalValue.alignment = { horizontal: "right", vertical: "middle" };

  totalRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEBF3FD" },
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF2672DF" } },
      bottom: { style: "medium", color: { argb: "FF2672DF" } },
    };
  });
  totalRow.height = 26;

  // 5. Ghi chú & Chữ ký
  worksheet.addRow([]);
  const noteRow = worksheet.addRow([
    "Ghi chú:",
    "- Đơn giá trên chưa bao gồm thuế GTGT (trừ khi có thỏa thuận khác).",
  ]);
  noteRow.getCell(1).font = { italic: true, bold: true, size: 9 };
  noteRow.getCell(2).font = { italic: true, size: 9 };

  worksheet.addRow([
    "",
    "- Báo giá có hiệu lực theo chính sách nội bộ THILOGI Logistics. Chi phí cầu đường, nâng hạ đã bao gồm theo từng gói dịch vụ.",
  ]).getCell(2).font = { italic: true, size: 9 };

  worksheet.addRow([]);
  worksheet.addRow([]);

  // Ký tên
  const signRow = worksheet.addRow(["", "ĐẠI DIỆN KHÁCH HÀNG", "", "", "", "ĐẠI DIỆN TẬP ĐOÀN THILOGI"]);
  signRow.getCell(2).font = { bold: true };
  signRow.getCell(2).alignment = { horizontal: "center" };
  signRow.getCell(6).font = { bold: true };
  signRow.getCell(6).alignment = { horizontal: "center" };

  // Set độ rộng cột hợp lý
  worksheet.getColumn(1).width = 6;
  worksheet.getColumn(2).width = 38;
  worksheet.getColumn(3).width = 16;
  worksheet.getColumn(4).width = 12;
  worksheet.getColumn(5).width = 10;
  worksheet.getColumn(6).width = 18;
  worksheet.getColumn(7).width = 20;
  worksheet.getColumn(8).width = 24;

  // Ghi file buffer và kích hoạt tải về trên trình duyệt
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `THILOGI_BaoGia_${data.quotationNo}_v${data.version}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export interface RoadRateExportItem {
  vendorName: string;
  pickupName: string;
  pickupCode: string;
  deliveryName: string;
  deliveryCode: string;
  equipmentType: string;
  buyRate: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
}

/**
 * Xuất danh sách Bảng giá mua đường bộ ra file Excel
 */
export async function exportRoadRatesToExcel(rates: RoadRateExportItem[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Bảng giá mua đường bộ");

  // Header
  const headerRow = worksheet.addRow([
    "STT",
    "Nhà Cung Cấp / Đối Tác",
    "Điểm Đi (Pickup)",
    "Mã Điểm Đi",
    "Điểm Đến (Delivery)",
    "Mã Điểm Đến",
    "Loại Thiết Bị",
    "Đơn Giá Mua",
    "Tiền Tệ",
    "Hiệu Lực Từ",
    "Hiệu Lực Đến",
    "Trạng Thái",
  ]);

  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF102F63" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 24;

  rates.forEach((r, idx) => {
    const row = worksheet.addRow([
      idx + 1,
      r.vendorName,
      r.pickupName,
      r.pickupCode,
      r.deliveryName,
      r.deliveryCode,
      r.equipmentType,
      r.buyRate,
      r.currency,
      r.validFrom,
      r.validTo,
      r.status,
    ]);

    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(8).numFmt = '#,##0 "₫"';
    row.getCell(8).alignment = { horizontal: "right" };
    row.getCell(9).alignment = { horizontal: "center" };
    row.getCell(10).alignment = { horizontal: "center" };
    row.getCell(11).alignment = { horizontal: "center" };
    row.getCell(12).alignment = { horizontal: "center" };
  });

  worksheet.columns.forEach((col) => {
    col.width = 18;
  });
  worksheet.getColumn(1).width = 6;
  worksheet.getColumn(2).width = 28;
  worksheet.getColumn(3).width = 24;
  worksheet.getColumn(5).width = 24;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `THILOGI_BangGiaMuaDuongBo_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

