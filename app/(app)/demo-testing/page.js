'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  FlaskConical,
  Info,
  Play,
  RotateCcw,
  ShieldCheck,
  Terminal,
  TestTubeDiagonal,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Button,
  Callout,
  DemoNote,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  cn,
} from '@/components/ui';
import {
  TESTS,
  TEST_COUNT,
  runAllTests,
  runTest,
  summarizeResults,
} from '@/lib/testing/testRunner';

function StatusBadge({ result }) {
  if (!result) {
    return (
      <Badge tone="slate">
        <CircleDashed size={12} />
        Not run
      </Badge>
    );
  }
  if (result.status === 'pass') {
    return (
      <Badge tone="emerald" dot>
        Pass
      </Badge>
    );
  }
  return (
    <Badge tone="rose" dot>
      Fail
    </Badge>
  );
}

function CheckRow({ item }) {
  return (
    <li className="flex items-start gap-2 text-[11.5px] leading-relaxed">
      {item.pass ? (
        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle size={13} className="mt-0.5 shrink-0 text-rose-500" />
      )}
      <span className={item.pass ? 'text-slate-600' : 'font-medium text-rose-700'}>
        {item.label}
        {item.detail ? (
          <span className={cn('ml-1', item.pass ? 'text-slate-400' : 'text-rose-500')}>
            — {item.detail}
          </span>
        ) : null}
      </span>
    </li>
  );
}

export default function DemoTestsPage() {
  const { canDo, resetDemoData, user } = useApp();
  const [results, setResults] = useState({});
  const [expanded, setExpanded] = useState({});
  const [lastRunAt, setLastRunAt] = useState(null);

  const summary = useMemo(() => summarizeResults(results), [results]);
  const canReset = canDo('demo.reset');

  const execute = (testId) => {
    const result = runTest(testId);
    setResults((previous) => ({ ...previous, [testId]: result }));
    setExpanded((previous) => ({ ...previous, [testId]: true }));
    setLastRunAt(result.ranAt);
    if (result.status === 'pass') {
      toast.success(`Passed — ${result.passedChecks}/${result.totalChecks} checks.`);
    } else {
      toast.error(`Failed — ${result.passedChecks}/${result.totalChecks} checks passed.`);
    }
    return result;
  };

  const handleRunOne = (testId) => {
    execute(testId);
  };

  const handleRunAll = () => {
    const all = runAllTests();
    const next = {};
    all.forEach((result) => {
      next[result.id] = result;
    });
    setResults(next);
    setExpanded({});
    const passed = all.filter((result) => result.status === 'pass').length;
    const failed = all.length - passed;
    setLastRunAt(new Date().toISOString());
    if (failed === 0) {
      toast.success(`All ${all.length} tests passed on isolated fixtures.`);
    } else {
      toast.error(`${passed} passed, ${failed} failed. Open a failed test for check details.`);
    }
  };

  const handleResetResults = () => {
    setResults({});
    setExpanded({});
    setLastRunAt(null);
    toast.success('Test results cleared. Nothing has been marked as passed.');
  };

  const handleResetDemo = () => {
    if (!canReset) {
      toast.error('Only the Administrator role can reset demonstration data.');
      return;
    }
    const confirmed =
      typeof window === 'undefined'
        ? false
        : window.confirm(
            'Reset ALL demonstration data to the original seed? Products, transactions, recommendations, audit logs, settings, and the current session state will be restored. This cannot be undone.'
          );
    if (!confirmed) return;

    const result = resetDemoData();
    if (result.ok) {
      setResults({});
      setExpanded({});
      setLastRunAt(null);
      toast.success('Demonstration data reset to the original seed. Test results cleared.');
    } else {
      toast.error(result.error || 'Demonstration data could not be reset.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Demo &amp; Testing Center"
        eyebrow={`${TEST_COUNT} isolated automated checks`}
        icon={FlaskConical}
        subtitle={`Run rule-level checks against fresh fixtures for ${user?.title || 'this demo'}. Tests never read or write your live inventory, and no result is marked PASS until the test actually runs.`}
        badges={
          <>
            <DemoNote />
            <Badge tone="brand">{TEST_COUNT} tests</Badge>
          </>
        }
        actions={
          <>
            <Button
              icon={Play}
              onClick={handleRunAll}
              data-tour="run-all-button"
              data-testid="run-all-button"
            >
              Run all tests
            </Button>
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={handleResetResults}
              disabled={summary.executed === 0}
            >
              Clear results
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Registered tests"
          value={TEST_COUNT}
          hint={`Exactly ${TEST_COUNT} demonstration checks`}
          icon={TestTubeDiagonal}
          tone="brand"
        />
        <StatCard
          label="Executed"
          value={`${summary.executed}/${TEST_COUNT}`}
          hint={summary.executed === 0 ? 'Nothing has been run yet' : 'Results from this session only'}
          icon={Terminal}
          tone="violet"
        />
        <StatCard
          label="Passed"
          value={summary.passed}
          hint={
            summary.executed === 0
              ? 'No PASS is shown before execution'
              : `${summary.checksPassed}/${summary.checksTotal} individual checks`
          }
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Failed"
          value={summary.failed}
          hint={summary.failed === 0 ? 'No failed tests' : 'Open the test to inspect checks'}
          icon={XCircle}
          tone="rose"
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600">
            <ShieldCheck size={13} className="text-emerald-500" />
            Isolated-fixture verification — the live localStorage state is never modified.
          </p>
          <p className="text-[10.5px] text-slate-400">
            {lastRunAt ? `Last run: ${new Date(lastRunAt).toLocaleTimeString('en-PH')}` : 'Not run in this session'}
          </p>
        </div>
        <div className="mt-2.5">
          <ProgressBar
            value={summary.executed === 0 ? 0 : Math.round((summary.passed / TEST_COUNT) * 100)}
            tone={summary.failed > 0 ? 'rose' : 'emerald'}
          />
        </div>
      </div>

      <div className="mt-4" data-tour="demo-tests" data-testid="demo-tests">
        <SectionCard
          title="Test suite"
          subtitle="Run a single check or the complete suite. Every result is computed now — nothing is pre-recorded."
          icon={TestTubeDiagonal}
          bodyClassName="px-0 pb-0"
        >
          <ul className="divide-y divide-slate-100">
            {TESTS.map((test, index) => {
              const result = results[test.id];
              const isOpen = Boolean(expanded[test.id]);
              return (
                <li key={test.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10.5px] font-bold text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[12.5px] font-bold text-slate-800">{test.name}</h3>
                          <Badge tone="slate">{test.category}</Badge>
                          <StatusBadge result={result} />
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                          {test.description}
                        </p>
                        <p className="mt-1 text-[10.5px] text-slate-400">
                          <strong className="font-semibold text-slate-500">Expected:</strong>{' '}
                          {test.expected}
                        </p>
                        {result ? (
                          <p className="mt-1 text-[10px] font-semibold text-slate-400">
                            {result.passedChecks}/{result.totalChecks} checks passed ·{' '}
                            {result.durationMs} ms ·{' '}
                            {new Date(result.ranAt).toLocaleTimeString('en-PH')}
                          </p>
                        ) : (
                          <p className="mt-1 text-[10px] font-semibold text-slate-400">
                            Not run — press Run test to execute on a fresh fixture.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:pl-3">
                      <Button
                        size="xs"
                        variant={result ? 'secondary' : 'primary'}
                        icon={Play}
                        onClick={() => handleRunOne(test.id)}
                      >
                        {result ? 'Run again' : 'Run test'}
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((previous) => ({ ...previous, [test.id]: !previous[test.id] }))
                        }
                        disabled={!result}
                        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10.5px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={isOpen ? 'Hide check details' : 'Show check details'}
                      >
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        Details
                      </button>
                    </div>
                  </div>

                  {result && isOpen ? (
                    <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:ml-10">
                      <ul className="space-y-1.5">
                        {result.checks.map((item, checkIndex) => (
                          <CheckRow key={`${test.id}-check-${checkIndex}`} item={item} />
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Reset demonstration data"
          subtitle="Administrator only · restores the original seed"
          icon={RotateCcw}
        >
          <p className="text-[11.5px] leading-relaxed text-slate-600">
            Resetting restores Bond Paper 20/50/100, Ballpen 150/30/200, USB Flash Drive 8/20/50,
            the historical demonstration transactions, four pending recommendations, suppliers,
            settings, and a fresh audit log. It preserves the current login session. Use this
            before a defense so the live workspace matches the documented seed.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="danger"
              icon={RotateCcw}
              onClick={handleResetDemo}
              disabled={!canReset}
              data-tour="reset-demo-button"
              data-testid="reset-demo-button"
            >
              Reset demo data
            </Button>
            {!canReset ? (
              <span className="text-[10.5px] font-medium text-rose-500">
                Your role cannot reset data. Sign in as admin@stocksense.demo.
              </span>
            ) : (
              <span className="text-[10.5px] text-slate-400">
                This clears every local change and every test result.
              </span>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="How these tests stay honest"
          subtitle="What is and is not verified"
          icon={Info}
        >
          <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-600">
            {[
              'Each test calls pure rule functions (stock planning, status, reorder, reconciliation, supplier guard) on a fresh fixture.',
              'Chatbot tests call the same response engine used by the widget, against isolated snapshots — never against live inventory.',
              'Results live only in this page session. Refreshing the page returns every test to “Not run”.',
              'The suite verifies business rules and data handling in this prototype; it does not claim production security, concurrency, or forecasting accuracy.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <Callout tone="info" className="mt-4" title="Testing limitations" icon={Info}>
        These are rule-level automated checks for an academic prototype. They do not test React
        rendering, browser compatibility, real multi-user concurrency, server authentication, or
        the accuracy of the historical moving-average forecast. Manual verification of roles,
        responsive layout, chatbot wording, and guided walkthroughs is still required and is
        documented separately.
      </Callout>
    </div>
  );
}
