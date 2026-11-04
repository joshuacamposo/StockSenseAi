// The 16 automated demonstration checks used by the Demo & Testing Center.
//
// Design rules:
// - Every test builds its own fixture; the live localStorage inventory is never touched.
// - Results are produced only when a test actually runs. Nothing is pre-marked as PASS.
// - Tests call the same pure rules used by the application and the chatbot response engine.

import { DEMO_ACCOUNTS } from '../../data/demoAccounts';
import { respond } from '../chatbot/responseEngine';
import {
  applyRecommendationDecision,
  reconcileRecommendations,
} from '../recommendations';
import { canDeleteSupplier } from '../supplierRules';
import {
  FIXTURE_NOW,
  FIXTURE_NOW_LATER,
  TEST_ADMIN,
  TEST_STAFF,
  applyFixtureMovement,
  buildFixtureRecommendations,
  createFixtureState,
  findProduct,
  withProductStock,
} from './fixtures';
import {
  calculateRecommendedQty,
  getStatusForStock,
  planStockMovement,
  validateProductInput,
} from '../inventoryRules';

function check(label, pass, detail = '') {
  return { label, pass: Boolean(pass), detail: String(detail || '') };
}

function notMutated(before, after) {
  return JSON.stringify(before) === JSON.stringify(after);
}

function recommendationFor(recommendations, productId) {
  return (
    recommendations.find(
      (recommendation) =>
        recommendation.productId === productId && recommendation.status === 'pending'
    ) || null
  );
}

export const TEST_CATEGORIES = {
  seed: 'Seed data',
  stock: 'Stock movement',
  automation: 'Automation',
  validation: 'Validation',
  assistant: 'Assistant',
};

export const TESTS = [
  {
    id: 'seed-requirements',
    name: 'Seed inventory matches the required starting values',
    category: TEST_CATEGORIES.seed,
    description:
      'Confirms Bond Paper 20/50/100, Ballpen 150/30/200, and USB Flash Drive 8/20/50 (stock / reorder level / target stock), plus the four demo roles.',
    expected: 'Three required products and four demo accounts exist with exact values.',
    run() {
      const state = createFixtureState();
      const bond = findProduct(state, 'BP-001');
      const pen = findProduct(state, 'PEN-001');
      const usb = findProduct(state, 'USB-001');
      const roles = new Set(DEMO_ACCOUNTS.map((account) => account.role));

      return {
        checks: [
          check('Bond Paper exists', Boolean(bond), bond ? bond.name : 'missing'),
          check(
            'Bond Paper stock / reorder / target = 20 / 50 / 100',
            bond?.stock === 20 && bond?.reorderLevel === 50 && bond?.targetStock === 100,
            bond ? `${bond.stock} / ${bond.reorderLevel} / ${bond.targetStock}` : 'missing'
          ),
          check('Ballpen exists', Boolean(pen), pen ? pen.name : 'missing'),
          check(
            'Ballpen stock / reorder / target = 150 / 30 / 200',
            pen?.stock === 150 && pen?.reorderLevel === 30 && pen?.targetStock === 200,
            pen ? `${pen.stock} / ${pen.reorderLevel} / ${pen.targetStock}` : 'missing'
          ),
          check('USB Flash Drive exists', Boolean(usb), usb ? usb.name : 'missing'),
          check(
            'USB Flash Drive stock / reorder / target = 8 / 20 / 50',
            usb?.stock === 8 && usb?.reorderLevel === 20 && usb?.targetStock === 50,
            usb ? `${usb.stock} / ${usb.reorderLevel} / ${usb.targetStock}` : 'missing'
          ),
          check(
            'Four demo roles are seeded: admin, owner, staff, viewer',
            ['admin', 'owner', 'staff', 'viewer'].every((role) => roles.has(role)),
            [...roles].join(', ')
          ),
        ],
      };
    },
  },
  {
    id: 'stock-in-valid',
    name: 'A valid stock-in increases stock and records a transaction',
    category: TEST_CATEGORIES.stock,
    description:
      'Receives 30 reams of Bond Paper. The balance must move from 20 to 50 and a transaction must be created.',
    expected: 'Stock becomes 50 and the transaction preserves the previous and updated balances.',
    run() {
      const state = createFixtureState();
      const result = applyFixtureMovement(state, 'prod-bp-001', 'in', 30, TEST_ADMIN);
      const bond = result.ok ? findProduct(result.state, 'BP-001') : null;

      return {
        checks: [
          check('Stock-in is accepted', result.ok, result.error || result.plan?.status?.label),
          check('Bond Paper stock becomes 50', bond?.stock === 50, `actual ${bond?.stock}`),
          check(
            'Exactly one transaction is recorded',
            result.state?.transactions.length === 1,
            `actual ${result.state?.transactions.length}`
          ),
          check(
            'Transaction keeps 20 → 50 balance history',
            result.transaction?.previousStock === 20 && result.transaction?.updatedStock === 50,
            `${result.transaction?.previousStock} → ${result.transaction?.updatedStock}`
          ),
          check(
            'Transaction stores product, type, quantity, and actor',
            result.transaction?.sku === 'BP-001' &&
              result.transaction?.type === 'in' &&
              result.transaction?.quantity === 30 &&
              result.transaction?.userId === TEST_ADMIN.id,
            `${result.transaction?.sku} / ${result.transaction?.type} / ${result.transaction?.quantity}`
          ),
        ],
      };
    },
  },
  {
    id: 'stock-in-invalid',
    name: 'Invalid stock-in quantities are rejected without changing stock',
    category: TEST_CATEGORIES.stock,
    description:
      'Tries zero, a negative value, a decimal, an empty value, and non-numeric text. All must fail before any balance changes.',
    expected: 'Every invalid quantity is rejected and stock stays at 20 with no transaction.',
    run() {
      const state = createFixtureState();
      const attempts = [0, -5, 2.5, '', 'abc'];
      const results = attempts.map((quantity) =>
        applyFixtureMovement(state, 'prod-bp-001', 'in', quantity, TEST_ADMIN)
      );
      const bond = findProduct(state, 'BP-001');

      return {
        checks: [
          ...attempts.map((quantity, index) =>
            check(
              `Quantity ${JSON.stringify(quantity)} is rejected`,
              results[index].ok === false,
              results[index].error || 'unexpectedly accepted'
            )
          ),
          check(
            'No invalid attempt created a transaction',
            results.every((result) => result.state.transactions.length === 0),
            'fixture transaction list stays empty'
          ),
          check('Bond Paper stock is still 20', bond.stock === 20, `actual ${bond.stock}`),
        ],
      };
    },
  },
  {
    id: 'stock-out-valid',
    name: 'A valid stock-out decreases stock and records a transaction',
    category: TEST_CATEGORIES.stock,
    description:
      'Issues 40 pieces of Ballpen. The balance must move from 150 to 110 without exceeding available stock.',
    expected: 'Stock becomes 110 and a stock-out transaction is recorded.',
    run() {
      const state = createFixtureState();
      const result = applyFixtureMovement(state, 'prod-pen-001', 'out', 40, TEST_STAFF);
      const pen = result.ok ? findProduct(result.state, 'PEN-001') : null;

      return {
        checks: [
          check('Stock-out is accepted', result.ok, result.error),
          check('Ballpen stock becomes 110', pen?.stock === 110, `actual ${pen?.stock}`),
          check(
            'Stock-out transaction is recorded',
            result.state?.transactions.length === 1 &&
              result.transaction?.type === 'out' &&
              result.transaction?.quantity === 40,
            `${result.transaction?.type} ${result.transaction?.quantity}`
          ),
          check(
            'Balance history is preserved',
            result.transaction?.previousStock === 150 && result.transaction?.updatedStock === 110,
            `${result.transaction?.previousStock} → ${result.transaction?.updatedStock}`
          ),
        ],
      };
    },
  },
  {
    id: 'stock-out-over-issue',
    name: 'A stock-out larger than available stock is rejected',
    category: TEST_CATEGORIES.stock,
    description:
      'Tries to issue 21 reams when only 20 exist. The balance must not become negative and no transaction may be written.',
    expected: 'Over-issue is rejected; Bond Paper remains at 20 with no transaction.',
    run() {
      const state = createFixtureState();
      const result = applyFixtureMovement(state, 'prod-bp-001', 'out', 21, TEST_STAFF);
      const bond = findProduct(state, 'BP-001');

      return {
        checks: [
          check('Over-issue is rejected', result.ok === false, result.error),
          check(
            'Error explains the available quantity',
            /available stock \(20 units\)/i.test(result.error || ''),
            result.error
          ),
          check(
            'No transaction was written',
            result.state.transactions.length === 0,
            `actual ${result.state.transactions.length}`
          ),
          check('Stock is still 20 and never negative', bond.stock === 20, `actual ${bond.stock}`),
        ],
      };
    },
  },
  {
    id: 'status-boundaries',
    name: 'Stock status boundaries are applied exactly',
    category: TEST_CATEGORIES.automation,
    description:
      'Checks the inclusive boundaries: 0 = Out of Stock, stock ≤ reorder level = Low Stock, and one unit above the reorder level = Sufficient.',
    expected: '0 → out, 1 → low, 50 → low, 51 → sufficient for a reorder level of 50.',
    run() {
      const cases = [
        { stock: 0, reorderLevel: 50, expected: 'out' },
        { stock: 1, reorderLevel: 50, expected: 'low' },
        { stock: 50, reorderLevel: 50, expected: 'low' },
        { stock: 51, reorderLevel: 50, expected: 'sufficient' },
      ];

      return {
        checks: cases.map((item) => {
          const actual = getStatusForStock(item.stock, item.reorderLevel).key;
          return check(
            `Stock ${item.stock} with reorder level ${item.reorderLevel} → ${item.expected}`,
            actual === item.expected,
            `actual ${actual}`
          );
        }),
      };
    },
  },
  {
    id: 'reorder-formula',
    name: 'Reorder quantity uses Max(Target Stock − Current Stock, 0)',
    category: TEST_CATEGORIES.automation,
    description:
      'Verifies the required formula for Bond Paper, Ballpen, and USB Flash Drive, including the zero floor when stock is already above target.',
    expected: 'BP = 80, PEN = 50, USB = 42, and an over-target product = 0.',
    run() {
      const state = createFixtureState();
      const bond = findProduct(state, 'BP-001');
      const pen = findProduct(state, 'PEN-001');
      const usb = findProduct(state, 'USB-001');
      const overTarget = { ...bond, stock: 120, targetStock: 100 };

      return {
        checks: [
          check('Bond Paper: Max(100 − 20, 0) = 80', calculateRecommendedQty(bond) === 80),
          check('Ballpen: Max(200 − 150, 0) = 50', calculateRecommendedQty(pen) === 50),
          check('USB Flash Drive: Max(50 − 8, 0) = 42', calculateRecommendedQty(usb) === 42),
          check(
            'Quantity never goes negative when stock exceeds target',
            calculateRecommendedQty(overTarget) === 0,
            `actual ${calculateRecommendedQty(overTarget)}`
          ),
        ],
      };
    },
  },
  {
    id: 'recommendation-generated',
    name: 'Low and out-of-stock products generate pending recommendations',
    category: TEST_CATEGORIES.automation,
    description:
      'Runs the reconciliation engine against the seed catalog. Products at or below their reorder level must receive a pending recommendation.',
    expected: 'Bond Paper, USB Flash Drive, Stapler, and Printer Toner get pending recommendations.',
    run() {
      const state = createFixtureState();
      const { recommendations, events } = reconcileRecommendations(
        state.products,
        [],
        FIXTURE_NOW
      );
      const bond = recommendationFor(recommendations, 'prod-bp-001');
      const usb = recommendationFor(recommendations, 'prod-usb-001');
      const stapler = recommendationFor(recommendations, 'prod-stp-001');
      const toner = recommendationFor(recommendations, 'prod-ton-001');
      const ballpen = recommendationFor(recommendations, 'prod-pen-001');

      return {
        checks: [
          check('Bond Paper recommendation is generated', Boolean(bond), bond ? `${bond.recommendedQty} units` : 'missing'),
          check('Bond Paper recommends 80 units', bond?.recommendedQty === 80, `actual ${bond?.recommendedQty}`),
          check('USB recommendation is generated', Boolean(usb), usb ? `${usb.recommendedQty} units` : 'missing'),
          check('USB recommends 42 units', usb?.recommendedQty === 42, `actual ${usb?.recommendedQty}`),
          check('Stapler (0 stock) recommendation is generated', Boolean(stapler)),
          check('Printer Toner recommendation is generated', Boolean(toner)),
          check('Healthy Ballpen does not receive a recommendation', ballpen === null),
          check(
            'Exactly four recommendations are created',
            recommendations.length === 4 && events.filter((event) => event.type === 'created').length === 4,
            `recommendations ${recommendations.length}`
          ),
        ],
      };
    },
  },
  {
    id: 'recommendation-resolved',
    name: 'Recommendations resolve automatically when stock becomes healthy',
    category: TEST_CATEGORIES.automation,
    description:
      'Raises Bond Paper above its reorder level and reconciles again. Its pending recommendation must become superseded without changing stock.',
    expected: 'Bond Paper recommendation becomes superseded; USB stays pending; stock stays 60.',
    run() {
      const state = createFixtureState();
      const initial = reconcileRecommendations(state.products, [], FIXTURE_NOW).recommendations;
      const healthy = withProductStock(state, 'prod-bp-001', 60);
      const next = reconcileRecommendations(healthy.products, initial, FIXTURE_NOW_LATER).recommendations;
      const bond = next.find((item) => item.productId === 'prod-bp-001');
      const usb = recommendationFor(next, 'prod-usb-001');

      return {
        checks: [
          check('Bond Paper recommendation is now superseded', bond?.status === 'superseded', bond?.status),
          check(
            'Automated closure is explained in the record',
            /above the reorder level/i.test(bond?.decisionNote || ''),
            bond?.decisionNote
          ),
          check('USB recommendation is still pending', usb?.status === 'pending', usb?.status),
          check(
            'Stock stays exactly 60 — reconciliation never changes stock',
            healthy.products.find((product) => product.id === 'prod-bp-001')?.stock === 60
          ),
        ],
      };
    },
  },
  {
    id: 'approval-no-stock-change',
    name: 'Approving a recommendation never adds stock',
    category: TEST_CATEGORIES.automation,
    description:
      'Approves the generated Bond Paper recommendation as the Administrator and checks that only the decision changes.',
    expected: 'Status becomes approved, an audit note is stored, and stock remains 20.',
    run() {
      const state = createFixtureState();
      const recommendations = buildFixtureRecommendations(state);
      const recommendation = recommendationFor(recommendations, 'prod-bp-001');
      const before = JSON.stringify(state.products);
      const result = applyRecommendationDecision(recommendation, 'approved', {
        actor: TEST_ADMIN,
        note: 'PO-2026-001 approved for supplier delivery.',
        now: FIXTURE_NOW_LATER,
      });
      const bond = findProduct(state, 'BP-001');

      return {
        checks: [
          check('Decision is accepted', result.ok, result.error),
          check('Status becomes approved', result.recommendation?.status === 'approved', result.recommendation?.status),
          check(
            'Decision records the reviewer',
            result.recommendation?.decidedBy === TEST_ADMIN.name,
            result.recommendation?.decidedBy
          ),
          check(
            'Decision note is preserved',
            result.recommendation?.decisionNote === 'PO-2026-001 approved for supplier delivery.',
            result.recommendation?.decisionNote
          ),
          check('Helper reports that stock did not change', result.stockChanged === false),
          check('Bond Paper stock remains 20', bond.stock === 20, `actual ${bond.stock}`),
          check('The product snapshot is untouched', notMutated(before, JSON.stringify(state.products))),
        ],
      };
    },
  },
  {
    id: 'rejection-no-stock-change',
    name: 'Rejecting a recommendation never changes stock',
    category: TEST_CATEGORIES.automation,
    description:
      'Rejects the generated USB recommendation and verifies that inventory is identical before and after the decision.',
    expected: 'Status becomes rejected, the decision is recorded, and stock remains 8.',
    run() {
      const state = createFixtureState();
      const recommendations = buildFixtureRecommendations(state);
      const recommendation = recommendationFor(recommendations, 'prod-usb-001');
      const before = JSON.stringify(state);
      const result = applyRecommendationDecision(recommendation, 'rejected', {
        actor: TEST_ADMIN,
        note: 'Deferred until next quarter.',
        now: FIXTURE_NOW_LATER,
      });
      const after = JSON.stringify(state);

      return {
        checks: [
          check('Rejection is accepted', result.ok, result.error),
          check('Status becomes rejected', result.recommendation?.status === 'rejected', result.recommendation?.status),
          check(
            'Rejection reason is preserved',
            result.recommendation?.decisionNote === 'Deferred until next quarter.',
            result.recommendation?.decisionNote
          ),
          check('USB Flash Drive stock remains 8', findProduct(state, 'USB-001').stock === 8),
          check('The isolated fixture is not mutated by the decision', before === after),
          check(
            'Only pending recommendations can be decided',
            applyRecommendationDecision(result.recommendation, 'approved', { actor: TEST_ADMIN }).ok === false
          ),
        ],
      };
    },
  },
  {
    id: 'duplicate-sku',
    name: 'Duplicate SKUs are rejected, case-insensitively',
    category: TEST_CATEGORIES.validation,
    description:
      'Submits a new product using “bp-001”, which already exists as “BP-001”, then verifies that a genuinely new SKU is accepted.',
    expected: 'The duplicate is rejected with a clear message; NEW-001 passes validation.',
    run() {
      const state = createFixtureState();
      const baseInput = {
        name: 'Test Bond Paper',
        category: 'Paper Products',
        unit: 'ream',
        unitPrice: 250,
        reorderLevel: 25,
        targetStock: 80,
      };
      const duplicate = validateProductInput({ ...baseInput, sku: 'bp-001' }, state.products);
      const unique = validateProductInput({ ...baseInput, sku: 'NEW-001' }, state.products);

      return {
        checks: [
          check('Duplicate SKU is rejected', duplicate.valid === false),
          check(
            'Error names the existing product and normalized SKU',
            /BP-001/.test(duplicate.errors.sku || '') && /already used/i.test(duplicate.errors.sku || ''),
            duplicate.errors.sku
          ),
          check('A unique SKU is accepted', unique.valid === true, JSON.stringify(unique.errors)),
          check('SKU is normalized to uppercase', unique.values?.sku === 'NEW-001', unique.values?.sku),
        ],
      };
    },
  },
  {
    id: 'supplier-delete-guard',
    name: 'Assigned suppliers cannot be deleted',
    category: TEST_CATEGORIES.validation,
    description:
      'Checks a supplier referenced by products (Northwind) and a supplier with no assignments. Only the unassigned supplier may be removed.',
    expected: 'Northwind deletion is blocked with an assignment count; an unused supplier can be deleted.',
    run() {
      const state = createFixtureState();
      const northwind = state.suppliers.find((supplier) => supplier.id === 'sup-northwind');
      const blocked = canDeleteSupplier(northwind, state.products);
      const unused = { id: 'sup-unused', name: 'Unused Demo Supplier' };
      const allowed = canDeleteSupplier(unused, state.products);

      return {
        checks: [
          check('Assigned supplier deletion is blocked', blocked.ok === false),
          check(
            'Blocked message reports the assignment count',
            blocked.assigned.length > 0 && /assigned to \d+ product/i.test(blocked.error || ''),
            blocked.error
          ),
          check('The blocked supplier is still referenced', blocked.assigned.map((item) => item.sku).join(', ')),
          check('Unassigned supplier deletion is allowed', allowed.ok === true, allowed.error),
          check('Unassigned supplier has no assignments', allowed.assigned.length === 0),
        ],
      };
    },
  },
  {
    id: 'chatbot-shared-state',
    name: 'The chatbot reads the shared inventory state',
    category: TEST_CATEGORIES.assistant,
    description:
      'Asks “How many Bond Paper are left?” against two isolated snapshots (20 units, then 37 units) and checks that the answer follows the data.',
    expected: 'The assistant answers 20, then 37 after the fixture stock changes, and never mutates state.',
    run() {
      const state = createFixtureState();
      const before = JSON.stringify(state);
      const first = respond({
        text: 'How many Bond Paper are left?',
        state,
        user: TEST_ADMIN,
        language: 'en',
      });
      const changed = withProductStock(state, 'prod-bp-001', 37);
      const second = respond({
        text: 'How many Bond Paper are left?',
        state: changed,
        user: TEST_ADMIN,
        language: 'en',
      });

      return {
        checks: [
          check('Question is classified as a product stock lookup', first.intent === 'product_stock', first.intent),
          check('First answer reports the shared stock value 20', /\b20\b/.test(first.text), first.text.slice(0, 140)),
          check('First answer identifies Bond Paper by SKU', /BP-001/.test(first.text)),
          check('Second answer follows the changed fixture value 37', /\b37\b/.test(second.text), second.text.slice(0, 140)),
          check('The assistant did not mutate the snapshot', notMutated(before, JSON.stringify(state))),
        ],
      };
    },
  },
  {
    id: 'chatbot-multilingual',
    name: 'The chatbot answers in Tagalog and Cebuano',
    category: TEST_CATEGORIES.assistant,
    description:
      'Uses the two demonstration questions from the defense script and checks language detection, product resolution, and localized answer text.',
    expected: 'Tagalog returns “Ang Bond Paper … 20”; Cebuano returns “Ang USB Flash Drive … 8”.',
    run() {
      const state = createFixtureState();
      const tagalog = respond({
        text: 'Ilan ang natitirang Bond Paper?',
        state,
        user: TEST_ADMIN,
        language: 'en',
      });
      const cebuano = respond({
        text: 'Pila ang nahabilin nga USB Flash Drive?',
        state,
        user: TEST_ADMIN,
        language: 'en',
      });

      return {
        checks: [
          check('Tagalog is detected', tagalog.language === 'tl', tagalog.language),
          check('Tagalog resolves Bond Paper', /BP-001/.test(tagalog.text), tagalog.text.slice(0, 140)),
          check('Tagalog answer contains the shared stock value 20', /\b20\b/.test(tagalog.text)),
          check('Tagalog answer uses localized wording', /Ang Bond Paper/.test(tagalog.text)),
          check('Cebuano is detected', cebuano.language === 'ceb', cebuano.language),
          check('Cebuano resolves USB Flash Drive', /USB-001/.test(cebuano.text), cebuano.text.slice(0, 140)),
          check('Cebuano answer contains the shared stock value 8', /\b8\b/.test(cebuano.text)),
          check('Cebuano answer uses localized wording', /Ang USB Flash Drive/.test(cebuano.text)),
        ],
      };
    },
  },
  {
    id: 'chatbot-safety',
    name: 'The chatbot refuses direct inventory changes',
    category: TEST_CATEGORIES.assistant,
    description:
      'Asks the assistant to add stock and to approve a recommendation. Both must be refused with a safe path through the interface, and the snapshot must stay unchanged.',
    expected: 'Both requests are refused, no data changes, and the assistant offers a valid next step.',
    run() {
      const state = createFixtureState();
      const before = JSON.stringify(state);
      const addStock = respond({
        text: 'Add 50 stock to Bond Paper right now',
        state,
        user: TEST_ADMIN,
        language: 'en',
      });
      const approve = respond({
        text: 'Approve the reorder recommendation now',
        state,
        user: TEST_ADMIN,
        language: 'en',
      });
      const after = JSON.stringify(state);

      return {
        checks: [
          check('Direct stock change is classified as a safety action', addStock.intent === 'safety_action', addStock.intent),
          check(
            'Assistant refuses to change inventory directly',
            /can't change inventory directly/i.test(addStock.text),
            addStock.text.slice(0, 140)
          ),
          check(
            'Assistant points to the validated stock-in workflow',
            addStock.action?.type === 'tour' && addStock.action?.tourId === 'stock-in',
            addStock.action?.tourId
          ),
          check('Chat approval is classified as a safety action', approve.intent === 'safety_action', approve.intent),
          check(
            'Assistant refuses to approve from chat',
            /can't approve or reject/i.test(approve.text),
            approve.text.slice(0, 140)
          ),
          check('No inventory state was changed by either request', before === after),
          check(
            'Bond Paper still has 20 units in the fixture',
            findProduct(state, 'BP-001').stock === 20
          ),
          check('The staff role is not granted decision permission', TEST_STAFF.role === 'staff'),
        ],
      };
    },
  },
];

export const TEST_COUNT = TESTS.length;

export function getTest(id) {
  return TESTS.find((test) => test.id === id) || null;
}

/**
 * Runs one test on a fresh fixture. Returns a result object; results are never cached or faked.
 */
export function runTest(id) {
  const test = getTest(id);
  const startedAt = Date.now();

  if (!test) {
    return {
      id,
      name: 'Unknown test',
      status: 'fail',
      checks: [check('Test exists', false, `No test registered with id "${id}".`)],
      durationMs: 0,
      ranAt: new Date().toISOString(),
    };
  }

  try {
    const outcome = test.run();
    const checks = Array.isArray(outcome?.checks) ? outcome.checks : [];
    const passed = checks.length > 0 && checks.every((item) => item.pass);
    return {
      id: test.id,
      name: test.name,
      status: passed ? 'pass' : 'fail',
      checks,
      passedChecks: checks.filter((item) => item.pass).length,
      totalChecks: checks.length,
      durationMs: Date.now() - startedAt,
      ranAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      id: test.id,
      name: test.name,
      status: 'fail',
      checks: [
        check(
          'Test executed without throwing',
          false,
          error instanceof Error ? error.message : String(error)
        ),
      ],
      passedChecks: 0,
      totalChecks: 1,
      durationMs: Date.now() - startedAt,
      ranAt: new Date().toISOString(),
    };
  }
}

export function runAllTests() {
  return TESTS.map((test) => runTest(test.id));
}

export function summarizeResults(results = {}) {
  const entries = Object.values(results);
  return {
    total: TESTS.length,
    executed: entries.length,
    passed: entries.filter((result) => result.status === 'pass').length,
    failed: entries.filter((result) => result.status === 'fail').length,
    notRun: Math.max(0, TESTS.length - entries.length),
    checksPassed: entries.reduce((sum, result) => sum + (result.passedChecks || 0), 0),
    checksTotal: entries.reduce((sum, result) => sum + (result.totalChecks || 0), 0),
  };
}
