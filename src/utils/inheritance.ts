import { HEIR_LABELS } from '@/constants';
import type {
  HeirShare,
  HeirsState,
  InheritanceInput,
  InheritanceResult,
} from '@/types';

/**
 * Simplified Islamic inheritance (Mirath) calculator.
 *
 * Disclaimer: This implementation covers the most common base cases of fard
 * (fixed) shares and asaba (residue) distribution between sons and daughters
 * with a 2:1 ratio. It intentionally does NOT attempt to handle every edge
 * case of classical fiqh (Awl, Radd, Kalala, Hajb between siblings and
 * grandparents, etc). When such a case is detected, `needsScholar` is set
 * and a warning is appended for the user.
 *
 * High-level algorithm:
 *  1. Subtract debts and bequest (capped at 1/3) from the gross estate.
 *  2. Compute fixed shares for the spouse and parents (when applicable).
 *  3. Sons / daughters / brothers / sisters take residue with 2:1 ratio,
 *     subject to standard hajb rules (children block siblings; father
 *     blocks grandfather; mother blocks grandmother, etc).
 *  4. If fixed shares > 1, mark the case as requiring a scholar (Awl).
 *     If fixed shares < 1 and there is no residuary heir, mark it
 *     for Radd review.
 */
export function calculateInheritance(input: InheritanceInput): InheritanceResult {
  const warnings: string[] = [];
  const heirs = input.heirs;

  const total = Math.max(0, input.total || 0);
  const debts = Math.max(0, input.debts || 0);
  const afterDebts = Math.max(0, total - debts);

  const maxBequest = afterDebts / 3;
  let bequest = Math.max(0, input.bequest || 0);
  if (bequest > maxBequest + 0.000001) {
    warnings.push('Завещание превышает 1/3 чистого наследства — оно автоматически уменьшено до 1/3.');
    bequest = maxBequest;
  }

  const distributable = Math.max(0, afterDebts - bequest);

  // ---------------- gate: nobody to inherit ----------------
  const anyHeir = Object.values(heirs).some((v) => v > 0);
  if (!anyHeir || distributable === 0) {
    return {
      netEstate: afterDebts,
      bequestAmount: bequest,
      distributable,
      shares: [],
      warnings: anyHeir
        ? warnings
        : [...warnings, 'Не указано ни одного наследника.'],
      needsScholar: false,
    };
  }

  const hasChildren = heirs.sons > 0 || heirs.daughters > 0;
  const hasMaleDescendant = heirs.sons > 0;
  const hasParent = heirs.father > 0 || heirs.mother > 0;
  const hasFather = heirs.father > 0;
  const hasMother = heirs.mother > 0;

  // Working table of fractions by heir key
  const fractions: Partial<Record<keyof HeirsState, number>> = {};
  const reasons: Partial<Record<keyof HeirsState, string>> = {};

  // ---- spouse ----
  if (heirs.husband === 1) {
    fractions.husband = hasChildren ? 1 / 4 : 1 / 2;
    reasons.husband = hasChildren
      ? 'Муж: 1/4 при наличии детей'
      : 'Муж: 1/2 при отсутствии детей';
  }
  if (heirs.wife > 0) {
    fractions.wife = hasChildren ? 1 / 8 : 1 / 4;
    reasons.wife = hasChildren
      ? 'Жёны: 1/8 при наличии детей (делится между ними)'
      : 'Жёны: 1/4 при отсутствии детей (делится между ними)';
  }

  // ---- mother ----
  const siblingsCount = heirs.brothers + heirs.sisters;
  if (hasMother) {
    if (hasChildren || siblingsCount >= 2) {
      fractions.mother = 1 / 6;
      reasons.mother = 'Мать: 1/6 (есть дети или 2+ брата/сестры)';
    } else {
      fractions.mother = 1 / 3;
      reasons.mother = 'Мать: 1/3 (нет детей и менее 2 братьев/сестёр)';
    }
  }

  // ---- grandmother (only if mother absent) ----
  if (heirs.grandmother === 1 && !hasMother) {
    fractions.grandmother = 1 / 6;
    reasons.grandmother = 'Бабушка: 1/6 (при отсутствии матери)';
  } else if (heirs.grandmother === 1 && hasMother) {
    warnings.push('Бабушка не наследует при наличии матери (хаджб).');
  }

  // ---- father ----
  // - With male descendant: father gets 1/6 strictly.
  // - With only daughters (no sons): father gets 1/6 + residue.
  // - With no descendants: father is residuary (handled below).
  if (hasFather) {
    if (hasMaleDescendant) {
      fractions.father = 1 / 6;
      reasons.father = 'Отец: 1/6 (есть сын / внук по мужской линии)';
    } else if (hasChildren) {
      fractions.father = 1 / 6;
      reasons.father = 'Отец: 1/6 + остаток (есть дочери, нет сыновей)';
    }
  }

  // ---- grandfather (only if father absent) ----
  if (heirs.grandfather === 1 && !hasFather) {
    if (hasMaleDescendant) {
      fractions.grandfather = 1 / 6;
      reasons.grandfather = 'Дедушка: 1/6 (заменяет отца)';
    } else if (hasChildren) {
      fractions.grandfather = 1 / 6;
      reasons.grandfather = 'Дедушка: 1/6 + остаток (заменяет отца)';
    }
  } else if (heirs.grandfather === 1 && hasFather) {
    warnings.push('Дедушка не наследует при наличии отца (хаджб).');
  }

  // ---- daughters (only when no sons; otherwise they share residue) ----
  if (heirs.daughters > 0 && heirs.sons === 0) {
    if (heirs.daughters === 1) {
      fractions.daughters = 1 / 2;
      reasons.daughters = 'Дочь: 1/2 (единственная дочь, нет сыновей)';
    } else {
      fractions.daughters = 2 / 3;
      reasons.daughters = 'Дочери: 2/3 (две и более, нет сыновей)';
    }
  }

  // ---- siblings: blocked when there are children or a father / grandfather ----
  const siblingsBlocked = hasChildren || hasFather || heirs.grandfather === 1;

  // Sum of all fixed fractions so far
  let fixedSum = Object.values(fractions).reduce((s, v) => s + (v || 0), 0);

  // Detect Awl (fixed shares overflow) — needs scholar
  if (fixedSum > 1 + 0.000001) {
    warnings.push(
      'Сумма обязательных долей превышает 1 (случай "Аул"). Доли пропорционально уменьшены.',
    );
  }

  // ---- residue ----
  let residueFraction = Math.max(0, 1 - fixedSum);

  // Determine residuary heirs and their weights (2:1 for male:female).
  // Priority: sons + daughters > father > grandfather > brothers + sisters.
  let residueWeights: Partial<Record<keyof HeirsState, number>> = {};

  if (heirs.sons > 0) {
    // Sons + daughters share residue 2:1
    residueWeights.sons = heirs.sons * 2;
    if (heirs.daughters > 0) residueWeights.daughters = heirs.daughters;
  } else if (heirs.daughters > 0 && residueFraction > 0 && !hasFather && heirs.grandfather === 0) {
    // Daughters already got fard; remaining residue (Radd) needs a scholar.
    warnings.push(
      'Остаток после долей дочерей подлежит распределению по правилу "Радд" — требуется консультация учёного.',
    );
  } else if (!hasChildren && hasFather && residueFraction > 0) {
    // Father takes residue when there are no descendants.
    residueWeights.father = 1;
  } else if (!hasChildren && !hasFather && heirs.grandfather === 1 && residueFraction > 0) {
    residueWeights.grandfather = 1;
  } else if (!siblingsBlocked && (heirs.brothers > 0 || heirs.sisters > 0) && residueFraction > 0) {
    // Full / consanguine / uterine siblings — simplified to "germane" treatment, 2:1.
    if (heirs.brothers > 0) {
      residueWeights.brothers = heirs.brothers * 2;
      if (heirs.sisters > 0) residueWeights.sisters = heirs.sisters;
    } else if (heirs.sisters > 0) {
      // Sisters without brothers: 1/2 (one) or 2/3 (more) — handle as fard-ish.
      if (heirs.sisters === 1) {
        fractions.sisters = 1 / 2;
        reasons.sisters = 'Сестра: 1/2 (единственная, без братьев)';
      } else {
        fractions.sisters = 2 / 3;
        reasons.sisters = 'Сёстры: 2/3 (две и более, без братьев)';
      }
      fixedSum = Object.values(fractions).reduce((s, v) => s + (v || 0), 0);
      residueFraction = Math.max(0, 1 - fixedSum);
    }
  }

  const totalResidueWeight = Object.values(residueWeights).reduce((s, v) => s + (v || 0), 0);

  if (totalResidueWeight > 0 && residueFraction > 0) {
    for (const key of Object.keys(residueWeights) as Array<keyof HeirsState>) {
      const w = residueWeights[key] || 0;
      const portion = (w / totalResidueWeight) * residueFraction;
      fractions[key] = (fractions[key] || 0) + portion;
      const existingReason = reasons[key];
      const residueReason = sonsResidueReason(key);
      reasons[key] = existingReason ? `${existingReason}; ${residueReason}` : residueReason;
    }
  } else if (residueFraction > 0.001 && !siblingsBlocked === false) {
    warnings.push(
      'После распределения остался неразделённый остаток. Для его распределения обратитесь к учёному (правило "Радд").',
    );
  }

  // Normalise on Awl (overflow): scale all fractions down so sum = 1.
  const finalSum = Object.values(fractions).reduce((s, v) => s + (v || 0), 0);
  if (finalSum > 1 + 0.000001) {
    const k = 1 / finalSum;
    for (const key of Object.keys(fractions) as Array<keyof HeirsState>) {
      fractions[key] = (fractions[key] || 0) * k;
    }
  }

  // ---- build the final share list ----
  const shares: HeirShare[] = (Object.keys(fractions) as Array<keyof HeirsState>)
    .map((key) => {
      const fraction = fractions[key] || 0;
      const count = heirs[key];
      if (fraction <= 0 || !count) return null;
      const amount = fraction * distributable;
      return {
        key: key as HeirShare['key'],
        label: HEIR_LABELS[key],
        count,
        fraction,
        amount,
        perPerson: amount / count,
        reason: reasons[key] || '',
      } satisfies HeirShare;
    })
    .filter((x): x is HeirShare => x !== null)
    .sort((a, b) => b.fraction - a.fraction);

  // Edge case: complicated family situation
  const needsScholar =
    warnings.some((w) => /Аул|Радд|учён/i.test(w)) ||
    (heirs.brothers > 0 && hasChildren === false && hasFather === false);

  if (needsScholar && !warnings.some((w) => /учён/i.test(w))) {
    warnings.push('Для точного распределения обратитесь к исламскому учёному.');
  }

  return {
    netEstate: afterDebts,
    bequestAmount: bequest,
    distributable,
    shares,
    warnings,
    needsScholar,
  };
}

function sonsResidueReason(key: keyof HeirsState): string {
  switch (key) {
    case 'sons':
      return 'Получают остаток по правилу "асаба" (2 части мужчине : 1 женщине)';
    case 'daughters':
      return 'Делят остаток с сыновьями (1 часть)';
    case 'father':
      return 'Получает остаток как ближайший мужчина-агнат';
    case 'grandfather':
      return 'Получает остаток (заменяет отца)';
    case 'brothers':
      return 'Получают остаток как асаба (2 части мужчине : 1 женщине)';
    case 'sisters':
      return 'Делят остаток с братьями';
    default:
      return 'Остаток';
  }
}

export const EMPTY_HEIRS: HeirsState = {
  husband: 0,
  wife: 0,
  sons: 0,
  daughters: 0,
  father: 0,
  mother: 0,
  grandfather: 0,
  grandmother: 0,
  brothers: 0,
  sisters: 0,
};
