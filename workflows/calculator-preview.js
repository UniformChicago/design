export function monthlyPayment(principal, annualRate, years) {
  const finite = (value) => (Number.isFinite(value) && value > 0 ? value : 0);
  principal = finite(principal);
  const payments = finite(years) * 12;
  const rate = finite(annualRate) / 1200;
  if (!payments || !principal) return 0;
  const payment = rate
    ? principal * (rate / -Math.expm1(-payments * Math.log1p(rate)))
    : principal / payments;
  return Number.isFinite(payment) ? payment : 0;
}

// Filled annular sectors avoid browser stroke-dash seams at fractional percentages.
export function donutSector(start, fraction) {
  if (!Number.isFinite(start) || !Number.isFinite(fraction) || fraction <= 0) return "";
  if (fraction >= 1)
    return "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z M50 16 A34 34 0 1 0 50 84 A34 34 0 1 0 50 16 Z";
  const point = (radius, turn) => {
    const angle = turn * 2 * Math.PI - Math.PI / 2;
    return `${(50 + radius * Math.cos(angle)).toFixed(6)} ${(50 + radius * Math.sin(angle)).toFixed(6)}`;
  };
  const end = start + fraction;
  const large = fraction > 0.5 ? 1 : 0;
  return `M${point(50, start)} A50 50 0 ${large} 1 ${point(50, end)} L${point(34, end)} A34 34 0 ${large} 0 ${point(34, start)} Z`;
}

export function connectCalculator(root) {
  const priceInput = root.querySelector("#calc-price");
  const downInput = root.querySelector("#calc-down");
  const downPercentLabel = root.querySelector("#calc-down-percent");
  const termInput = root.querySelector("#calc-term");
  const rateInput = root.querySelector("#calc-rate");
  const hoaInput = root.querySelector("#calc-hoa-input");
  const includeTaxes = root.querySelector("#calc-taxes");

  const paymentOutput = root.querySelector("#calc-payment");
  const principalOutput = root.querySelector("#calc-principal");
  const taxesOutput = root.querySelector("#calc-taxes-val");
  const taxesLabel = root.querySelector("#calc-taxes-label");
  const hoaOutput = root.querySelector("#calc-hoa");

  const segments = root.querySelectorAll(".u-donut-chart-segment");
  const totalText = root.querySelector(".u-donut-chart-text");

  function calculate() {
    const price = Math.min(1e12, Math.max(0, Number(priceInput.value) || 0));
    const downPercent = Math.min(100, Math.max(0, Number(downInput.value) || 0));
    const downPayment = price * (downPercent / 100);
    const principal = price - downPayment;

    downPercentLabel.textContent = `${downPercent}% ($${Math.round(downPayment).toLocaleString()})`;

    const monthlyPI = monthlyPayment(
      principal,
      Math.min(100, Number(rateInput.value)),
      Number(termInput.value),
    );

    // Dummy taxes & insurance (1.2% property tax, $1000 insurance per year)
    const monthlyTaxes = includeTaxes.checked ? (price * 0.012) / 12 + 1000 / 12 : 0;
    const monthlyHOA = Math.min(1e6, Math.max(0, Number(hoaInput.value) || 0));

    const total = monthlyPI + monthlyTaxes + monthlyHOA;

    paymentOutput.textContent = `$${Math.round(total).toLocaleString()}`;
    totalText.textContent = `$${Math.round(total).toLocaleString()}`;
    totalText.removeAttribute("textLength");
    totalText.removeAttribute("lengthAdjust");
    if (totalText.getComputedTextLength() > 62) {
      totalText.setAttribute("textLength", "62");
      totalText.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
    principalOutput.textContent = `$${Math.round(monthlyPI).toLocaleString()}`;

    if (taxesOutput) {
      taxesOutput.textContent = `$${Math.round(monthlyTaxes).toLocaleString()}`;
      taxesLabel.classList.toggle("u-legend-item--excluded", !includeTaxes.checked);
    }

    if (hoaOutput) hoaOutput.textContent = `$${monthlyHOA.toLocaleString()}`;

    const amounts = [monthlyPI, monthlyTaxes, monthlyHOA];
    let start = 0;
    segments.forEach((segment, index) => {
      const fraction = total > 0 ? amounts[index] / total : 0;
      segment.setAttribute("d", donutSector(start, fraction));
      start += fraction;
    });
  }

  [priceInput, downInput, termInput, rateInput, includeTaxes, hoaInput].forEach((input) => {
    input.addEventListener("input", calculate);
  });

  calculate();
}

if (typeof document !== "undefined")
  document.querySelectorAll("[data-calculator]").forEach(connectCalculator);
