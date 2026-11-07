"use client";

import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  FileUp,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { bulkImportRoadRatesAction } from "@/features/master-data/actions";
import {
  downloadRoadRatesImportTemplate,
  parseRoadRatesFromExcel,
  type RoadRateImportRow,
} from "@/shared/utils/excel";

interface RatesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RatesImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: RatesImportDialogProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImport, setParsedImport] = useState<{
    validRows: RoadRateImportRow[];
    errors: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setImportFile(null);
    setParsedImport(null);
    setImporting(false);
    setParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (nextOpen: boolean) => {
    if (importing) return;
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setParsing(true);
    try {
      const res = await parseRoadRatesFromExcel(file);
      setParsedImport({ validRows: res.validRows, errors: res.errors });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể đọc file Excel");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedImport?.validRows.length) return;
    setImporting(true);
    try {
      const res = await bulkImportRoadRatesAction(parsedImport.validRows);
      if (!res.success) throw new Error(res.error);
      toast.success(res.message || `Đã nhập thành công ${res.count} bảng giá!`);
      handleClose(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi nhập bảng giá");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-150" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[95vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-surface border border-border p-4 sm:p-6 text-foreground shadow-2xl space-y-4 focus:outline-none font-sans animate-in zoom-in-95 duration-150">
          {/* Header Dialog */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-foreground">
                  Nhập biểu cước đường bộ từ Excel
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                  Tải file .xlsx theo đúng cấu trúc mẫu biểu cước của THILOGI.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild disabled={importing}>
              <button
                type="button"
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Bước 1: Tải template mẫu */}
          <div className="p-3 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground">Chưa có file mẫu?</span>
              <p className="text-muted-foreground text-[11px]">
                Tải file Excel mẫu với các cột chuẩn hóa để chuẩn bị dữ liệu cước.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void downloadRoadRatesImportTemplate()}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" /> Tải file mẫu
            </Button>
          </div>

          {/* Bước 2: Upload file */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Chọn file Excel (.xlsx) từ máy tính:
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-border hover:border-blue-500 rounded-xl p-5 sm:p-6 text-center bg-background/50 hover:bg-surface-hover transition-colors space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="text-xs font-medium text-foreground">
                {importFile ? (
                  <span className="font-bold text-blue-600">
                    {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  <>Click để chọn file hoặc kéo thả file Excel vào đây</>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Chỉ hỗ trợ file định dạng .xlsx, tối đa 500 dòng/lần
              </p>
            </div>
          </div>

          {/* Bước 3: Phân tích & Kết quả validate */}
          {parsing && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Đang đọc và phân tích cấu trúc dữ liệu…
            </p>
          )}

          {parsedImport && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Kết quả kiểm tra dữ liệu:</span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-3 h-3" /> {parsedImport.validRows.length} hợp lệ
                  </span>
                  {parsedImport.errors.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold text-xs">
                      <AlertCircle className="w-3 h-3" /> {parsedImport.errors.length} lỗi
                    </span>
                  )}
                </div>
              </div>

              {parsedImport.errors.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-2.5 text-xs text-red-600 dark:text-red-400 space-y-1">
                  <p className="font-bold">Các dòng không hợp lệ (sẽ bị bỏ qua khi nhập):</p>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
                    {parsedImport.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parsedImport.errors.length > 10 && (
                      <li>… và {parsedImport.errors.length - 10} dòng khác.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Bước 4: Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => handleClose(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={importing || !parsedImport?.validRows.length}
              loading={importing}
              onClick={handleConfirmImport}
            >
              Xác nhận nhập ({parsedImport?.validRows.length ?? 0} dòng)
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

