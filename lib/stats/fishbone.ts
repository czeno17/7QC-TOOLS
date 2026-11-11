export type FishboneCategory = {
  name: string;
  causes: string[];
};

export function summarizeFishbone(effect: string, categories: FishboneCategory[]) {
  const usedCategories = categories.filter(category => category.causes.length > 0);
  const totalCauses = usedCategories.reduce((total, category) => total + category.causes.length, 0);
  const biggest = usedCategories.reduce<FishboneCategory | null>(
    (largest, category) => !largest || category.causes.length > largest.causes.length ? category : largest,
    null
  );
  const problem = effect.trim() || "Problem Effect";

  return {
    effect: problem,
    categories: usedCategories,
    totalCauses,
    interpretation: biggest
      ? `${totalCauses} candidate cause(s) mapped across ${usedCategories.length} categor${usedCategories.length === 1 ? "y" : "ies"} for "${problem}". ${biggest.name} holds the most listed causes (${biggest.causes.length}) — prioritize data-based verification of those first.`
      : "",
  };
}
