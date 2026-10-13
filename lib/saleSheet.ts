import type { SaleSheet } from '../types';
export const emptySaleSheet = (): SaleSheet => ({ saleNumber: '', company: '', city: '', state: '', paymentTerms: '', farm: '', invoiceValue: 0, products: [], discounts: [], driverCity: '', driverState: '', freightPerBox: 0, insuranceIncluded: false, notes: '' });
const cents = (value: number) => Math.round(value * 100);
export function saleTotals(sheet: SaleSheet) {
 const boxes = sheet.totalBoxes ?? sheet.products.reduce((total, line) => total + line.quantity, 0);
 const gross = sheet.totalBoxes !== undefined ? sheet.invoiceValue : sheet.products.reduce((total, line) => total + cents(line.quantity * line.unitPrice), 0) / 100;
 const discounts = sheet.discounts.reduce((total, line) => total + cents(line.quantity * line.unitPrice), 0) / 100;
 return { boxes, gross, discounts, payable: Math.round((gross - discounts) * 100) / 100, freight: cents(boxes * sheet.freightPerBox) / 100 };
}
