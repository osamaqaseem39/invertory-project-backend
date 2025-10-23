/**
 * Print Integration
 * Handles receipt printing and document printing
 */

import { BrowserWindow, webContents } from 'electron';

export interface PrintOptions {
  silent?: boolean;
  printBackground?: boolean;
  deviceName?: string;
  color?: boolean;
  margins?: {
    marginType: 'default' | 'none' | 'printableArea' | 'custom';
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  landscape?: boolean;
  scaleFactor?: number;
  pagesPerSheet?: number;
  collate?: boolean;
  copies?: number;
  pageRanges?: Array<{ from: number; to: number }>;
  duplexMode?: 'simplex' | 'shortEdge' | 'longEdge';
  dpi?: { horizontal: number; vertical: number };
  header?: string;
  footer?: string;
  pageSize?: string | { width: number; height: number };
}

/**
 * Print content from window
 */
export async function printWindow(
  window: BrowserWindow,
  options: PrintOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultOptions: Electron.PrintToPDFOptions = {
      printBackground: options.printBackground !== false,
      landscape: options.landscape || false,
      pageSize: (options.pageSize as any) || 'A4',
    };

    // For silent printing, use print() directly
    if (options.silent) {
      await window.webContents.print(
        {
          silent: true,
          printBackground: options.printBackground !== false,
          deviceName: options.deviceName,
          color: options.color !== false,
          margins: options.margins,
          landscape: options.landscape,
          scaleFactor: options.scaleFactor,
          pagesPerSheet: options.pagesPerSheet,
          collate: options.collate,
          copies: options.copies || 1,
          pageRanges: options.pageRanges,
          duplexMode: options.duplexMode,
          dpi: options.dpi,
          header: options.header,
          footer: options.footer,
          pageSize: options.pageSize as any,
        },
        (success, failureReason) => {
          if (!success) {
            console.error('❌ Print failed:', failureReason);
          }
        }
      );
      return { success: true };
    }

    // Show print dialog
    return new Promise((resolve) => {
      window.webContents.print(
        {
          silent: false,
          printBackground: options.printBackground !== false,
          deviceName: options.deviceName,
        },
        (success, failureReason) => {
          if (success) {
            console.log('✅ Print successful');
            resolve({ success: true });
          } else {
            console.error('❌ Print failed:', failureReason);
            resolve({ success: false, error: failureReason });
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Print error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Print receipt (thermal printer format - 80mm)
 */
export async function printReceipt(
  window: BrowserWindow,
  receiptHtml: string,
  printerName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create hidden window for printing
    const hiddenWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await hiddenWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHtml));

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Print with receipt-specific settings
    const result = await printWindow(hiddenWindow, {
      silent: true,
      deviceName: printerName,
      printBackground: true,
      pageSize: { width: 80000, height: 297000 }, // 80mm x 297mm
      margins: {
        marginType: 'none',
      },
    });

    hiddenWindow.close();
    return result;
  } catch (error) {
    console.error('❌ Receipt print error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Print to PDF
 */
export async function printToPDF(
  window: BrowserWindow,
  outputPath: string,
  options: Electron.PrintToPDFOptions = {}
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const defaultOptions: Electron.PrintToPDFOptions = {
      printBackground: true,
      landscape: false,
      pageSize: 'A4',
      ...options,
    };

    const data = await window.webContents.printToPDF(defaultOptions);
    const fs = require('fs');
    await fs.promises.writeFile(outputPath, data);

    console.log(`✅ PDF saved: ${outputPath}`);
    return { success: true, path: outputPath };
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get available printers
 */
export async function getAvailablePrinters(window: BrowserWindow): Promise<Electron.PrinterInfo[]> {
  try {
    const printers = await window.webContents.getPrintersAsync();
    console.log(`📄 Found ${printers.length} printer(s)`);
    return printers;
  } catch (error) {
    console.error('❌ Error getting printers:', error);
    return [];
  }
}

/**
 * Get default printer
 */
export async function getDefaultPrinter(window: BrowserWindow): Promise<Electron.PrinterInfo | null> {
  try {
    const printers = await getAvailablePrinters(window);
    const defaultPrinter = printers.find((p) => p.isDefault);
    return defaultPrinter || null;
  } catch (error) {
    console.error('❌ Error getting default printer:', error);
    return null;
  }
}

/**
 * Print invoice
 */
export async function printInvoice(
  window: BrowserWindow,
  invoiceHtml: string,
  options: PrintOptions = {}
): Promise<{ success: boolean; error?: string }> {
  return printWindow(window, {
    printBackground: true,
    pageSize: 'A4',
    margins: {
      marginType: 'default',
    },
    ...options,
  });
}

/**
 * Print report
 */
export async function printReport(
  window: BrowserWindow,
  reportHtml: string,
  options: PrintOptions = {}
): Promise<{ success: boolean; error?: string }> {
  return printWindow(window, {
    printBackground: true,
    pageSize: 'A4',
    landscape: options.landscape || false,
    margins: {
      marginType: 'default',
    },
    ...options,
  });
}

