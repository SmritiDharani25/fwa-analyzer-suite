import { useState } from "react";
import { Activity, Gauge } from "lucide-react";
import {
  assessmentFromScore,
  hashString,
  money,
  peerSeries,
  riskDistribution,
  signalSeries,
  type ProviderRecord,
  type ReviewStatus,
} from "@/lib/fwa";
import { KpiCard, Panel, ScoreDial } from "./primitives";
import { BarSeries, ChartFrame, PeerCompare, RiskDonut, SignalRadar, TrendLine } from "./charts";
import { PowerBiPanel } from "./PowerBiPanel";
import { LlmReport } from "./LlmReport";
import { HumanReview } from "./HumanReview";

export function ProviderDetail({
  provider,
  onStatusChange,
}: {
  provider: ProviderRecord;
  onStatusChange?: (status: ReviewStatus) => void;
}) {
  const [status, setStatus] = useState<ReviewStatus>(provider.status);
  const seed = hashString(provider.providerId);
  const peer = peerSeries(seed);
  const signals = signalSeries(seed);

  function handleStatus(next: ReviewStatus) {
    setStatus(next);
    onStatusChange?.(next);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-panel animate-rise p-5 md:col-span-2">
          <ScoreDial score={provider.riskScore} />
        </div>
        <KpiCard label="Risk Rating" value={provider.rating} tone={provider.rating.toLowerCase() as "high"} delay={60} />
        <KpiCard label="Assessment" value={assessmentFromScore(provider.riskScore)} delay={120} />
        <KpiCard label="Claim Count" value={provider.claimCount.toLocaleString()} delay={0} />
        <KpiCard label="Beneficiary Count" value={provider.beneficiaryCount.toLocaleString()} delay={60} />
        <KpiCard label="Reimbursed Amount" value={money(provider.reimbursedAmount)} delay={120} />
        <KpiCard label="Payment / Beneficiary" value={money(provider.paymentPerBeneficiary)} tone="accent" delay={180} />
        <KpiCard label="Peer Deviation" value={`${provider.peerDeviation > 0 ? "+" : ""}${provider.peerDeviation}%`} delay={0} />
        <KpiCard label="Utilization Index" value={`${provider.utilization}×`} hint="1.0 = cohort norm" delay={60} />
        <KpiCard label="Days Admitted" value={provider.daysAdmitted.toLocaleString()} delay={120} />
        <KpiCard label="Specialty" value={provider.specialty} delay={180} />
      </div>

      <PowerBiPanel
        title="Provider Power BI Dashboard"
        filterTable="Providers"
        filterColumn="ProviderID"
        filterValue={provider.providerId}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartFrame title="Payment vs Peer Cohort">
            <PeerCompare data={peer} />
          </ChartFrame>
          <ChartFrame title="Behavioral Indicators">
            <SignalRadar data={signals} />
          </ChartFrame>
          <ChartFrame title="Temporal Indicators">
            <TrendLine data={peer.map((p) => ({ name: p.name, value: p.subject }))} />
          </ChartFrame>
          <ChartFrame title="Signal Strength">
            <BarSeries data={signals.slice(0, 5)} color="var(--chart-2)" />
          </ChartFrame>
        </div>
      </PowerBiPanel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <LlmReport
          score={provider.riskScore}
          rating={provider.rating}
          assessment={assessmentFromScore(provider.riskScore)}
          blocks={[
            {
              label: "Key Signals",
              body: [
                `Payment per beneficiary of ${money(provider.paymentPerBeneficiary)} exceeds the ${provider.specialty} cohort norm.`,
                `Utilization index of ${provider.utilization}× indicates elevated service intensity.`,
                `${provider.claimCount.toLocaleString()} claims across ${provider.beneficiaryCount.toLocaleString()} beneficiaries produces a concentrated billing ratio.`,
              ],
            },
            {
              label: "Peer Comparison",
              body: `Relative to matched ${provider.specialty} providers, reimbursement deviates by ${provider.peerDeviation}% and admitted days by ${(provider.daysAdmitted / 30).toFixed(1)} months of cumulative stay.`,
            },
            {
              label: "Behavioral Patterns",
              body: [
                "Repeat high-intensity procedure mix within short billing windows.",
                "Weekly volume spikes clustered near period-end submissions.",
                "Beneficiary overlap with previously reviewed provider clusters.",
              ],
            },
            {
              label: "Supporting Evidence",
              body: [
                `Provider ${provider.providerId} · Specialty ${provider.specialty}`,
                `Total reimbursed ${money(provider.reimbursedAmount)} across ${provider.claimCount.toLocaleString()} claims.`,
                `Peer deviation ${provider.peerDeviation}% · Utilization ${provider.utilization}×`,
              ],
            },
            {
              label: "Assessment",
              body: `"${assessmentFromScore(provider.riskScore)}" — provider behavior shows patterns that differ from relevant peer benchmarks.`,
            },
            {
              label: "LLM Reasoning",
              body: `The explanation aggregates model feature attributions into narrative form. No single indicator establishes intent; the combination of payment concentration, utilization intensity and temporal clustering explains why the provider is rated ${provider.rating.toLowerCase()} risk and is routed for expert verification.`,
            },
          ]}
        />
        <div className="space-y-6">
          <Panel title="Risk Composition" icon={Gauge}>
            <ChartFrame title="Cohort Risk Distribution">
              <RiskDonut data={riskDistribution([provider.riskScore, 28, 55, 84, 61, 33, 92, 47])} />
            </ChartFrame>
          </Panel>
          <Panel title="Payment Statistics" icon={Activity}>
            <ChartFrame title="Payment Concentration">
              <BarSeries
                data={[
                  { name: "P25", value: Math.round(provider.paymentPerBeneficiary * 0.5) },
                  { name: "P50", value: Math.round(provider.paymentPerBeneficiary * 0.72) },
                  { name: "P75", value: Math.round(provider.paymentPerBeneficiary * 0.9) },
                  { name: "Provider", value: provider.paymentPerBeneficiary },
                ]}
              />
            </ChartFrame>
          </Panel>
        </div>
      </div>

      <HumanReview status={status} onChange={handleStatus} subject={`Provider ${provider.providerId}`} />
    </div>
  );
}
