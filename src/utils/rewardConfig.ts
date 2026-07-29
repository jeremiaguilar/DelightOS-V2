import { Product } from '../types';

export interface ProductRewardConfig {
  allowReward: boolean;
  rewardPoints: number;
}

const STORAGE_KEY = 'delight_product_rewards';

export function getProductRewardConfigs(): Record<string, ProductRewardConfig> {
  if (typeof window === 'undefined') return {};

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return {};

  try {
    return JSON.parse(saved) as Record<string, ProductRewardConfig>;
  } catch (error) {
    console.error('Error loading product reward configs', error);
    return {};
  }
}

export function saveProductRewardConfigs(configs: Record<string, ProductRewardConfig>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function getDefaultRewardPointsForProduct(product: { category: string; name?: string }): number {
  if (product.category === 'Extras') return 5;
  if (product.category === 'Café') return 20;
  if (product.category === 'Frappés') return 20;
  if (product.category === 'Smoothies') return 20;
  if (product.category === 'Sushiburger') return 50;

  if (product.category === 'Makis' || product.category?.includes('Makis')) {
    if (product.name?.toLowerCase().includes('empanizado')) return 45;
    return 40;
  }

  return 20;
}

export function enrichProductsWithRewards(prods: Product[]): Product[] {
  const configs = getProductRewardConfigs();

  return prods.map((product) => {
    const config = configs[product.id];
    return {
      ...product,
      allowReward: config ? config.allowReward : true,
      rewardPoints: config ? config.rewardPoints : getDefaultRewardPointsForProduct(product),
    };
  });
}
