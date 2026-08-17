import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ListOrdered, Play, Table2 } from "lucide-react";
import { AppShell } from "@/components/fwa/AppShell";
import { KpiCard, PageHeading, Panel, RiskBadge, StatusBadge } from "@/components/fwa/primitives";
import { UploadCard, type UploadedFile } from "@/components/fwa/UploadCard";
import { PowerBiPanel } from "@/components/fwa/PowerBiPanel";
import { BarSeries, ChartFrame, RiskDonut } from "@/components/fwa/charts";
import { ProviderDetail } from "@/components/fwa/ProviderDetail";
import { Button } from "@/components/ui/button";
import {
  bucketBy,
  generateProviders,
  hashString,
  isSuspicious,
  money,
  riskDistribution,
  type ProviderRecord,
  type ReviewStatus,
} from "@/lib/fwa";

export const Route = createFileRoute("/providers/batch")({
  head: () => ({
    meta: [
      { title: "Batch Provider Analysis — FWA Risk Investigator" },
      { name: "description", content: "Upload a provider dataset to rank network risk and route entities to investigation." },
      { property: "og:title", content: "Batch Provider Analysis — FWA Risk Investigator" },
      { property: "og:description", content: "Upload a provider dataset to rank network risk and route entities to investigation." },
    ],
  }),
  component: BatchProvidersPage,
});

function BatchProvidersPage() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [rows, setRows] = useState<ProviderRecord[] | null>(null);
  const [view, setView] = useState<"table" | "queue">("table");
  const [selected, setSelected] = useState<ProviderRecord | null>(null);
  const [analysing, setAnalysing] = useState(false);

  function analyse() {
    if (!file) return;
    setAnalysing(true);
    setTimeout(() => {
      setRows(generateProviders(Math.min(file.records, 90), hashString(file.name)));
      setAnalysing(false);
    }, 700);
  }

  function updateStatus(providerId: string, status: ReviewStatus) {
    setRows((prev) => prev?.map((r) => (r.providerId === providerId ? { ...r, status } : r)) ?? prev);
    setSelected((prev) => (prev && prev.providerId === providerId ? { ...prev, status } : prev));
  }

  const kpis = useMemo(() => {
    if (!rows) return null;
    const scores = rows.map((r) => r.riskScore);
    return {
      total: rows.length,
      suspicious: rows.filter((r) => isSuspicious(r.riskScore)).length,
      high: rows.filter((r) => r.rating === "High").length,
      medium: rows.filter((r) => r.rating === "Medium").length,
      low: rows.filter((r) => r.rating === "Low").length,
      beneficiaries: rows.reduce((a, b) => a + b.beneficiaryCount, 0),
      claims: rows.reduce((a, b) => a + b.claimCount, 0),
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    };
  }, [rows]);

  const queue = useMemo(() => (rows ? [...rows].sort((a, b) => b.riskScore - a.riskScore) : []), [rows]);

  return (
    <AppShell>
      <PageHeading
        eyebrow="Provider Investigation"
        title="BATCH PROVIDER ANALYSIS"
        subtitle="Upload → Analyse → Dashboard → Table → Row detail → Human review."
        actions={
          rows ? (
            <>
              <Button
                variant={view === "table" ? "default" : "outline"}
                onClick={() => {
                  setView("table");
                  setSelected(null);
                }}
                className="rounded-full transition-all duration-300 hover:-translate-y-0.5"
              >
                <Table2 className="size-4" /> Results Table
              </Button>
              <Button
                variant={view === "queue" ? "default" : "outline"}
                onClick={() => {
                  setView("queue");
                  setSelected(null);
                }}
                className="rounded-full transition-all duration-300 hover:-translate-y-0.5"
              >
                <ListOrdered className="size-4" /> Investigate
              </Button>
            </>
          ) : null
        }
      />

      {!rows ? (
        <div className="mx-auto max-w-3xl space-y-6">
          <UploadCard
            label="Upload Providers File"
            hint="Select a CSV, Excel or JSON provider extract. Provider attributes are mapped to the peer-benchmarking schema."
            file={file}
            onUploaded={(f) => setFile(f)}
          />
          {file ? (
            <div className="animate-rise flex justify-center">
              <Button
                onClick={analyse}
                disabled={analysing}
                className="rounded-full px-8 py-5 text-sm font-semibold tracking-[0.12em] uppercase shadow-float transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Play className="size-4" />
                {analysing ? "Scoring network…" : "Analyse Provider"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total Providers" value={kpis!.total} hint={file?.name ?? ""} />
            <KpiCard label="Suspicious Cases" value={kpis!.suspicious} tone="high" delay={60} />
            <KpiCard label="High Risk Providers" value={kpis!.high} tone="high" delay={120} />
            <KpiCard label="Medium Risk Providers" value={kpis!.medium} tone="medium" delay={180} />
            <KpiCard label="Low Risk Providers" value={kpis!.low} tone="low" delay={0} />
            <KpiCard label="Unique Beneficiaries" value={kpis!.beneficiaries.toLocaleString()} delay={60} />
            <KpiCard label="Total Claims" value={kpis!.claims.toLocaleString()} delay={120} />
            <KpiCard label="Average Risk Score" value={kpis!.avg} tone="accent" delay={180} />
          </div>

          <PowerBiPanel
            title="Batch Provider Power BI Dashboard"
            description={`Dataset: ${file?.name ?? "uploaded providers"}`}
          >
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <ChartFrame title="Risk Distribution">
                <RiskDonut data={riskDistribution(rows.map((r) => r.riskScore))} />
              </ChartFrame>
              <ChartFrame title="Provider Distribution">
                <BarSeries data={bucketBy(rows, (r) => r.specialty)} />
              </ChartFrame>
              <ChartFrame title="Payment Distribution">
                <BarSeries
                  data={[
                    { name: "<1K", value: rows.filter((r) => r.paymentPerBeneficiary < 1000).length },
                    { name: "1–3K", value: rows.filter((r) => r.paymentPerBeneficiary >= 1000 && r.paymentPerBeneficiary < 3000).length },
                    { name: "3–6K", value: rows.filter((r) => r.paymentPerBeneficiary >= 3000 && r.paymentPerBeneficiary < 6000).length },
                    { name: "6K+", value: rows.filter((r) => r.paymentPerBeneficiary >= 6000).length },
                  ]}
                  color="var(--chart-3)"
                />
              </ChartFrame>
              <ChartFrame title="Utilization Distribution">
                <BarSeries
                  data={[
                    { name: "<1×", value: rows.filter((r) => r.utilization < 1).length },
                    { name: "1–1.5×", value: rows.filter((r) => r.utilization >= 1 && r.utilization < 1.5).length },
                    { name: "1.5–2×", value: rows.filter((r) => r.utilization >= 1.5 && r.utilization < 2).length },
                    { name: "2×+", value: rows.filter((r) => r.utilization >= 2).length },
                  ]}
                  color="var(--chart-2)"
                />
              </ChartFrame>
            </div>
          </PowerBiPanel>

          {selected ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
                className="rounded-full transition-all duration-300 hover:-translate-y-0.5"
              >
                <ArrowLeft className="size-4" /> Back to {view === "queue" ? "queue" : "results table"}
              </Button>
              <ProviderDetail
                key={selected.providerId}
                provider={selected}
                onStatusChange={(status) => updateStatus(selected.providerId, status)}
              />
            </div>
          ) : view === "table" ? (
            <Panel
              title="Batch Provider Results"
              description="Select any row to open the provider investigation view"
              icon={Table2}
              bodyClassName="p-0"
            >
              <ProviderTable rows={rows} onSelect={setSelected} />
            </Panel>
          ) : (
            <Panel
              title="Provider Investigation Queue"
              description="Sorted by risk score — highest risk first"
              icon={ListOrdered}
              bodyClassName="p-0"
            >
              <QueueTable rows={queue} onSelect={setSelected} />
            </Panel>
          )}
        </div>
      )}
    </AppShell>
  );
}

const TH = "sticky top-0 z-10 bg-secondary/80 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground backdrop-blur";
const TD = "px-4 py-3 text-sm text-foreground whitespace-nowrap";

function ProviderTable({ rows, onSelect }: { rows: ProviderRecord[]; onSelect: (row: ProviderRecord) => void }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Provider ID", "Specialty", "Claims", "Beneficiaries", "Reimbursed", "Utilization", "Risk", "Rating", "Status"].map(
              (h) => (
                <th key={h} className={TH}>
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.providerId}
              onClick={() => onSelect(row)}
              className="cursor-pointer border-t border-border/60 transition-colors duration-200 hover:bg-secondary/60"
            >
              <td className={`${TD} font-medium`}>{row.providerId}</td>
              <td className={TD}>{row.specialty}</td>
              <td className={`${TD} tabular-nums`}>{row.claimCount.toLocaleString()}</td>
              <td className={`${TD} tabular-nums`}>{row.beneficiaryCount.toLocaleString()}</td>
              <td className={`${TD} tabular-nums`}>{money(row.reimbursedAmount)}</td>
              <td className={`${TD} tabular-nums`}>{row.utilization}×</td>
              <td className={`${TD} tabular-nums font-semibold`}>{row.riskScore}</td>
              <td className={TD}>
                <RiskBadge rating={row.rating} />
              </td>
              <td className={TD}>
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueueTable({ rows, onSelect }: { rows: ProviderRecord[]; onSelect: (row: ProviderRecord) => void }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["#", "Provider ID", "Risk", "Rating", "Status"].map((h) => (
              <th key={h} className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.providerId}
              onClick={() => onSelect(row)}
              className="cursor-pointer border-t border-border/60 transition-colors duration-200 hover:bg-secondary/60"
            >
              <td className={`${TD} text-muted-foreground tabular-nums`}>{i + 1}</td>
              <td className={`${TD} font-medium`}>{row.providerId}</td>
              <td className={`${TD} tabular-nums font-semibold`}>{row.riskScore}</td>
              <td className={TD}>
                <RiskBadge rating={row.rating} />
              </td>
              <td className={TD}>
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
