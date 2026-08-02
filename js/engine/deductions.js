// Vehicle deduction caps (research brief §3).
// Order matters and is fixed: inside the shared ฿500k retirement ceiling,
// clamping runs rmf → pvd → gpf → nsf → pensionLife.
// Inside the ฿100k insurance group, LIFE is clamped before HEALTH.
const S = (thb) => thb * 100;

const perVehicleCap = (v, grossSatang) => {
  const incomeCap = v.income_cap_bp === null ? Infinity : Math.round(grossSatang * v.income_cap_bp / 10000);
  return Math.min(incomeCap, S(v.cap_thb));
};

export function applyVehicleCaps({ grossSatang, inputs = {} }, cfg) {
  const V = cfg.vehicles;
  const allowed = {}; const clampedIds = [];
  const clamp = (id, want, cap) => {
    const got = Math.max(0, Math.min(want ?? 0, cap));
    if ((want ?? 0) > got) clampedIds.push(id);
    allowed[id] = got; return got;
  };

  // Retirement group — fixed order, shared ceiling
  const ceiling = S(V.retirement_ceiling_thb);
  let used = 0;
  for (const [id, key] of [['rmf', 'rmf'], ['pvd', 'pvd'], ['gpf', 'gpf'], ['nsf', 'nsf'], ['pensionLife', 'pension_life']]) {
    const cap = Math.min(perVehicleCap(V[key], grossSatang), ceiling - used);
    used += clamp(id, inputs[id], cap);
  }

  // Thai ESG — separate stack
  clamp('thaiEsg', inputs.thaiEsg, perVehicleCap(V.thai_esg, grossSatang));

  // Insurance ฿100k group: life first, then health against remaining headroom
  const groupCap = S(V.insurance100k_group_cap_thb);
  const life = clamp('lifeIns', inputs.lifeIns, Math.min(perVehicleCap(V.life_ins, grossSatang), groupCap));
  clamp('healthIns', inputs.healthIns, Math.min(perVehicleCap(V.health_ins, grossSatang), groupCap - life));

  clamp('parentsHealth', inputs.parentsHealth, perVehicleCap(V.parents_health, grossSatang));

  const totalDeductibleSatang = Object.values(allowed).reduce((a, b) => a + b, 0);
  return {
    allowed, clampedIds,
    retirement: { usedSatang: used, ceilingSatang: ceiling },
    insurance: { usedSatang: allowed.lifeIns + allowed.healthIns, ceilingSatang: groupCap },
    totalDeductibleSatang,
  };
}
