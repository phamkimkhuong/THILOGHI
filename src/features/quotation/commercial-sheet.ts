import { z } from "zod";
// Explicit public projection: internal costs, suppliers, FX and margin cannot reach the print component.
export const commercialSheetSchema = z.object({
  quotationNo: z.string(), version: z.number(), customerName: z.string(), taxCode: z.string(), address: z.string(),
  commodity: z.string(), paymentTermsDays: z.number(), totalSellAmount: z.number(), currency: z.string(),
  items: z.array(z.object({ service: z.string(), inclusion: z.string(), origin: z.string(), destination: z.string(), equipment: z.string(), quantity: z.number(), unit: z.string(), unitPrice: z.number(), amount: z.number() })),
});
export type CommercialSheet = z.infer<typeof commercialSheetSchema>;
