"use client";

import * as React from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn";

/**
 * Root Form Provider bọc toàn bộ form React Hook Form.
 */
const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

/**
 * FormField kết nối controller của RHF với render prop.
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

/**
 * Hook truy xuất thông tin lỗi, ID của trường nhập liệu hiện tại.
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField phải được sử dụng bên trong <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

/**
 * Container bọc từng trường nhập liệu, tự tạo ID liên kết ngữ nghĩa (A11y).
 */
function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-1.5", className)} {...props} />
    </FormItemContext.Provider>
  );
}

/**
 * Nhãn tiêu đề trường nhập liệu. Tự động đổi màu đỏ khi có lỗi.
 */
function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { error, formItemId } = useFormField();

  return (
    <label
      className={cn(
        "text-xs font-semibold text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-red-600 dark:text-red-400 font-bold",
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
}

/**
 * Khung điều khiển, tự gán aria-describedby và aria-invalid cho input con.
 */
function FormControl({ ...props }: React.ComponentPropsWithRef<"div">) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <div
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

/**
 * Dòng chú thích hướng dẫn người dùng dưới ô nhập.
 */
function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      id={formDescriptionId}
      className={cn("text-[11px] text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Thông báo lỗi validate của Zod / RHF ngay dưới chân ô nhập (Inline Validation).
 */
function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;

  if (!body) {
    return null;
  }

  return (
    <p
      id={formMessageId}
      role="alert"
      className={cn(
        "text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{body}</span>
    </p>
  );
}

/**
 * Component hiển thị lỗi inline độc lập (dành cho cả form RHF và form có validation state trực tiếp).
 */
export function FormError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn(
        "text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 animate-in fade-in-50",
        className
      )}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/**
 * Lưới form responsive chuẩn hóa:
 * cols=1: 1 cột (Mobile & Desktop)
 * cols=2: 1 cột Mobile, 2 cột Desktop/Tablet
 * cols=3: 1 cột Mobile, 2 cột Tablet, 3 cột Desktop
 * cols=4: 1 cột Mobile, 2 cột Tablet, 3 cột Laptop, 4 cột Desktop
 */
export function FormGrid({
  children,
  cols = 2,
  className = "",
}: {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[cols];

  return <div className={cn("grid gap-3.5", colClass, className)}>{children}</div>;
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};

