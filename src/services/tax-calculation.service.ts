import { PrismaClient, TaxClass } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface TaxConfig {
  default_tax_rate: number;
  tax_inclusive: boolean;
  rounding_method: 'none' | '0.05' | '0.10' | '1.00';
}

interface CalculateTaxParams {
  amount: number;
  tax_class: TaxClass;
  tax_rate?: number;
  tax_inclusive: boolean;
}

interface TaxResult {
  subtotal: number;
  tax_amount: number;
  total: number;
}

interface ItemWithTax {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  tax_class: TaxClass;
  tax_rate?: number;
}

// ===== CONSTANTS =====

const TAX_RATES: Record<TaxClass, number> = {
  STANDARD: 10.0,    // 10%
  REDUCED: 5.0,      // 5%
  ZERO: 0.0,         // 0%
  EXEMPT: 0.0,       // 0%
};

// ===== SERVICE =====

export class TaxCalculationService {
  /**
   * Get tax configuration from database
   */
  static async getTaxConfig(): Promise<TaxConfig> {
    const configs = await prisma.systemConfig.findMany({
      where: {
        category: 'tax',
        key: { in: ['default_tax_rate', 'tax_inclusive', 'rounding_method'] },
      },
    });

    const configMap: Record<string, string> = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });

    return {
      default_tax_rate: parseFloat(configMap.default_tax_rate || '10'),
      tax_inclusive: configMap.tax_inclusive === 'true',
      rounding_method: (configMap.rounding_method as any) || 'none',
    };
  }

  /**
   * Calculate tax for a single amount
   */
  static calculateTax(params: CalculateTaxParams): TaxResult {
    const taxRate = params.tax_rate !== undefined 
      ? params.tax_rate 
      : TAX_RATES[params.tax_class];

    if (params.tax_class === 'ZERO' || params.tax_class === 'EXEMPT') {
      return {
        subtotal: params.amount,
        tax_amount: 0,
        total: params.amount,
      };
    }

    if (params.tax_inclusive) {
      // Tax is included in the amount
      // amount = subtotal + tax
      // amount = subtotal * (1 + tax_rate/100)
      // subtotal = amount / (1 + tax_rate/100)
      const subtotal = params.amount / (1 + taxRate / 100);
      const taxAmount = params.amount - subtotal;

      return {
        subtotal: subtotal,
        tax_amount: taxAmount,
        total: params.amount,
      };
    } else {
      // Tax is added to the amount
      const taxAmount = params.amount * (taxRate / 100);
      const total = params.amount + taxAmount;

      return {
        subtotal: params.amount,
        tax_amount: taxAmount,
        total: total,
      };
    }
  }

  /**
   * Calculate tax for multiple items (cart)
   */
  static async calculateCartTax(items: ItemWithTax[], taxInclusive: boolean): Promise<{
    items: Array<{
      product_id: string;
      subtotal: number;
      tax_amount: number;
      total: number;
    }>;
    totals: {
      subtotal: number;
      tax_amount: number;
      total: number;
    };
  }> {
    const itemResults = [];
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalAmount = 0;

    for (const item of items) {
      // Calculate line total before tax
      const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percentage || 0) / 100);

      // Calculate tax for this item
      const taxResult = this.calculateTax({
        amount: lineTotal,
        tax_class: item.tax_class,
        tax_rate: item.tax_rate,
        tax_inclusive: taxInclusive,
      });

      itemResults.push({
        product_id: item.product_id,
        subtotal: taxResult.subtotal,
        tax_amount: taxResult.tax_amount,
        total: taxResult.total,
      });

      totalSubtotal += taxResult.subtotal;
      totalTax += taxResult.tax_amount;
      totalAmount += taxResult.total;
    }

    return {
      items: itemResults,
      totals: {
        subtotal: totalSubtotal,
        tax_amount: totalTax,
        total: totalAmount,
      },
    };
  }

  /**
   * Apply rounding to a total
   */
  static applyRounding(amount: number, method: 'none' | '0.05' | '0.10' | '1.00'): {
    original: number;
    rounded: number;
    delta: number;
  } {
    if (method === 'none') {
      return {
        original: amount,
        rounded: amount,
        delta: 0,
      };
    }

    const roundTo = parseFloat(method);
    const rounded = Math.round(amount / roundTo) * roundTo;
    const delta = rounded - amount;

    return {
      original: amount,
      rounded: rounded,
      delta: delta,
    };
  }

  /**
   * Get tax rate for a product
   */
  static async getProductTaxRate(productId: string): Promise<number> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        tax_class: true,
        tax_rate_override: true,
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Use override if set, otherwise use class rate
    return product.tax_rate_override 
      ? Number(product.tax_rate_override) 
      : TAX_RATES[product.tax_class];
  }

  /**
   * Initialize default tax configuration
   */
  static async initializeTaxConfig(actorId: string) {
    const configs = [
      {
        key: 'default_tax_rate',
        value: '10.0',
        data_type: 'number',
        category: 'tax',
        description: 'Default tax rate percentage',
      },
      {
        key: 'tax_inclusive',
        value: 'false',
        data_type: 'boolean',
        category: 'tax',
        description: 'Whether prices include tax',
      },
      {
        key: 'rounding_method',
        value: 'none',
        data_type: 'string',
        category: 'tax',
        description: 'Rounding method (none, 0.05, 0.10, 1.00)',
      },
    ];

    for (const config of configs) {
      const existing = await prisma.systemConfig.findUnique({
        where: { key: config.key },
      });

      if (!existing) {
        await prisma.systemConfig.create({
          data: {
            ...config,
            updated_by_id: actorId,
          },
        });
      }
    }
  }

  /**
   * Update tax configuration
   */
  static async updateTaxConfig(key: string, value: string, actorId: string) {
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        updated_by_id: actorId,
      },
      create: {
        key,
        value,
        data_type: 'string',
        category: 'tax',
        updated_by_id: actorId,
      },
    });

    return config;
  }
}

export default TaxCalculationService;

