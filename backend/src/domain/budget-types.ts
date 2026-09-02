export type BudgetSnapshot = {
  limitUsd: number | null;
  spentUsd: number;
  remainingUsd: number | null;
};

export type SpendFile = {
  spentUsd: number;
};
