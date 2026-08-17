import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ListOrdered, Play, Table2 } from "lucide-react";
import { AppShell } from "@/components/fwa/AppShell";
import { KpiCard, PageHeading, Panel, RiskBadge, StatusBadge } from "@/components/fwa/primitives";
import { UploadCard, type UploadedFile } from "@/components/fwa/UploadCard";
import { PowerBiPanel } from "@/components/fwa/PowerBiPanel";
import { BarSeries, ChartFrame, RiskDonut } from "@/components/fwa/charts";
import { ClaimDetail } from "@/components/fwa/ClaimDetail";
import { Button } from "@/components/ui/button";
import {
  amountBuckets,
  bucketBy,
  generateClaims,
  hashString,
  isSuspicious,
  money,
  riskDistribution,
  type ClaimRecord,
  type ReviewStatus,
} from "@/lib/fwa";

export const Route = createFileRoute("/claims/batch")({
  head: () => ({
    meta: [
      { title: "Batch Claim Analysis — FWA Risk Investigator" },
      { name: "description", content: "Upload a claims dataset to score risk, review KPIs and triage a prioritized queue." },
      { property: "og:title", content: "Batch Claim Analysis — FWA Risk Investigator" },
      { property: "og:description", content: "Upload a claims dataset to score risk, review KPIs and triage a prioritized queue." },
    ],
  }),
  component: BatchClaimsPage,
});

function BatchClaimsPage() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [rows, setRows] = useState<ClaimRecord[] | null>(null);
  const [view, setView] = useState<"table" | "queue">("table");
  const [selected, setSelected] = useState<ClaimRecord | null>(null);
  const [analysing, setAnalysing] = useState(false);

  function analyse() {
    if (!file) return;
    setAnalysing(true);
    setTimeout(() => {
      setRows(generateClaims(Math.min(file.records, 120), hashString(file.name)));
      setAnalysing(false);
    }, 700);
  }

  function updateStatus(claimId: string, status: ReviewStatus) {
    setRows((prev) => prev?.map((r) => (r.claimId === claimId ? { ...r, status } : r)) ?? prev);
    setSelected((prev) => (prev && prev.claimId === claimId ? { ...prev, status } : prev));
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
      providers: new Set(rows.map((r) => r.providerId)).size,
      beneficiaries: new Set(rows.map((r) => r.beneficiaryId)).size,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    };
  }, [rows]);

  const queue = useMemo(() => (rows ? [...rows].sort((a, b) => b.riskScore - a.riskScore) : []), [rows]);

  return (
    <AppShell>
      <PageHeading
        eyebrow="Claim Investigation"
        title="BATCH CLAIM ANALYSIS"
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
                <ListOrdered className="size-4" /> Queue
              </Button>
            </>
          ) : null
        }
      />

      {!rows ? (
        <div className="mx-auto max-w-3xl space-y-6">
          <UploadCard
            label="Upload Claims File"
            hint="Select a CSV, Excel or JSON claims extract. Column names are detected automatically and mapped to the scoring schema."
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
                {analysing ? "Scoring dataset…" : "Analyse"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total Claims" value={kpis!.total} hint={file?.name} />
            <KpiCard label="Suspicious Cases" value={kpis!.suspicious} tone="high" delay={60} />
            <KpiCard label="High Risk" value={kpis!.high} tone="high" delay={120} />
            <KpiCard label="Medium Risk" value={kpis!.medium} tone="medium" delay={180} />
            <KpiCard label="Low Risk" value={kpis!.low} tone="low" delay={0} />
            <KpiCard label="Unique Providers" value={kpis!.providers} delay={60} />
            <KpiCard label="Unique Beneficiaries" value={kpis!.beneficiaries} delay={120} />
            <KpiCard label="Average Risk Score" value={kpis!.avg} tone="accent" delay={180} />
          </div>

          <PowerBiPanel title="Batch Claim Power BI Dashboard" description={`Dataset: ${file?.name ?? "uploaded claims"}`}>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <ChartFrame title="Risk Distribution">
                <RiskDonut data={riskDistribution(rows.map((r) => r.riskScore))} />
              </ChartFrame>
              <ChartFrame title="Claim Distribution">
                <BarSeries data={bucketBy(rows, (r) => r.claimType)} />
              </ChartFrame>
              <ChartFrame title="Provider Distribution">
                <BarSeries data={bucketBy(rows, (r) => r.providerId).slice(0, 7)} color="var(--chart-2)" />
              </ChartFrame>
              <ChartFrame title="Payment Distribution">
                <BarSeries data={amountBuckets(rows.map((r) => r.paymentAmount))} color="var(--chart-3)" />
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
              <ClaimDetail
                key={selected.claimId}
                claim={selected}
                onStatusChange={(status) => updateStatus(selected.claimId, status)}
              />
            </div>
          ) : view === "table" ? (
            <Panel
              title="Batch Claim Results"
              description="Select any row to open the claim investigation view"
              icon={Table2}
              bodyClassName="p-0"
            >
              <ClaimTable rows={rows} onSelect={setSelected} />
            </Panel>
          ) : (
            <Panel
              title="Investigation Queue"
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

function ClaimTable({ rows, onSelect }: { rows: ClaimRecord[]; onSelect: (row: ClaimRecord) => void }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Claim ID", "Provider ID", "Beneficiary ID", "Claim Type", "Claim Amount", "Services", "Risk", "Rating", "Status"].map(
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
              key={row.claimId}
              onClick={() => onSelect(row)}
              className="cursor-pointer border-t border-border/60 transition-colors duration-200 hover:bg-secondary/60"
            >
              <td className={`${TD} font-medium`}>{row.claimId}</td>
              <td className={TD}>{row.providerId}</td>
              <td className={TD}>{row.beneficiaryId}</td>
              <td className={TD}>{row.claimType}</td>
              <td className={`${TD} tabular-nums`}>{money(row.claimAmount)}</td>
              <td className={`${TD} tabular-nums`}>{row.serviceCount}</td>
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

function QueueTable({ rows, onSelect }: { rows: ClaimRecord[]; onSelect: (row: ClaimRecord) => void }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["#", "Claim ID", "Provider ID", "Risk", "Rating", "Status"].map((h) => (
              <th key={h} className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.claimId}
              onClick={() => onSelect(row)}
              className="cursor-pointer border-t border-border/60 transition-colors duration-200 hover:bg-secondary/60"
            >
              <td className={`${TD} text-muted-foreground tabular-nums`}>{i + 1}</td>
              <td className={`${TD} font-medium`}>{row.claimId}</td>
              <td className={TD}>{row.providerId}</td>
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
