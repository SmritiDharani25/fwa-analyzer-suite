import { useState } from "react";
import { Activity, Gauge } from "lucide-react";
import {
  amountBuckets,
  assessmentFromScore,
  hashString,
  money,
  peerSeries,
  riskDistribution,
  signalSeries,
  type ClaimRecord,
  type ReviewStatus,
} from "@/lib/fwa";
import { KpiCard, Panel, ScoreDial } from "./primitives";
import { BarSeries, ChartFrame, PeerCompare, RiskDonut, SignalRadar, TrendLine } from "./charts";
import { PowerBiPanel } from "./PowerBiPanel";
import { LlmReport } from "./LlmReport";
import { HumanReview } from "./HumanReview";

export function ClaimDetail({
  claim,
  onStatusChange,
}: {
  claim: ClaimRecord;
  onStatusChange?: (status: ReviewStatus) => void;
}) {
  const [status, setStatus] = useState<ReviewStatus>(claim.status);
  const seed = hashString(claim.claimId);
  const peer = peerSeries(seed);
  const signals = signalSeries(seed);
  const percentile = Math.min(99, Math.max(4, Math.round(claim.riskScore * 0.9 + 6)));
  const peerPayment = Math.round(claim.paymentAmount / (1 + claim.riskScore / 120));

  function handleStatus(next: ReviewStatus) {
    setStatus(next);
    onStatusChange?.(next);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-panel animate-rise p-5 md:col-span-2">
          <ScoreDial score={claim.riskScore} />
        </div>
        <KpiCard label="Risk Rating" value={claim.rating} tone={claim.rating.toLowerCase() as "high"} delay={60} />
        <KpiCard label="Assessment" value={assessmentFromScore(claim.riskScore)} delay={120} />
        <KpiCard label="Payment vs Peer" value={`${Math.round((claim.paymentAmount / peerPayment - 1) * 100)}%`} hint={`Peer median ${money(peerPayment)}`} tone="accent" delay={0} />
        <KpiCard label="Payment Percentile" value={`P${percentile}`} hint="Within specialty cohort" delay={60} />
        <KpiCard label="Service Count" value={claim.serviceCount} hint="Lines on claim" delay={120} />
        <KpiCard label="Claim Duration" value={`${claim.duration} days`} delay={180} />
        <KpiCard label="Claim Frequency" value={`${(1 + (seed % 40) / 10).toFixed(1)}×`} hint="vs beneficiary baseline" delay={0} />
        <KpiCard label="Submitted Amount" value={money(claim.claimAmount)} delay={60} />
        <KpiCard label="Allowed Amount" value={money(claim.allowedAmount)} delay={120} />
        <KpiCard label="Paid Amount" value={money(claim.paymentAmount)} delay={180} />
      </div>

      <PowerBiPanel
        title="Claim Power BI Dashboard"
        filterTable="Claims"
        filterColumn="ClaimID"
        filterValue={claim.claimId}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartFrame title="Payment vs Peer Behavior">
            <PeerCompare data={peer} />
          </ChartFrame>
          <ChartFrame title="Behavioral Signals">
            <SignalRadar data={signals} />
          </ChartFrame>
          <ChartFrame title="Peer Signal Strength">
            <BarSeries data={signals.slice(0, 5)} color="var(--chart-2)" />
          </ChartFrame>
          <ChartFrame title="Utilization Trend">
            <TrendLine data={peer.map((p) => ({ name: p.name, value: p.subject }))} />
          </ChartFrame>
        </div>
      </PowerBiPanel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <LlmReport
          score={claim.riskScore}
          rating={claim.rating}
          assessment={assessmentFromScore(claim.riskScore)}
          blocks={[
            {
              label: "Key Signals",
              body: [
                `Paid amount sits in the P${percentile} band for ${claim.claimType} claims of comparable duration.`,
                `Service count of ${claim.serviceCount} across ${claim.duration} days deviates from the cohort median.`,
                `Allowed-to-submitted ratio of ${(claim.allowedAmount / claim.claimAmount).toFixed(2)} is atypical for this provider.`,
              ],
            },
            {
              label: "Supporting Evidence",
              body: [
                `Claim ${claim.claimId} · Provider ${claim.providerId} · Beneficiary ${claim.beneficiaryId}`,
                `Submitted ${money(claim.claimAmount)}, allowed ${money(claim.allowedAmount)}, paid ${money(claim.paymentAmount)}, deductible ${money(claim.deductible)}.`,
                `Peer median payment for the matched cohort: ${money(peerPayment)}.`,
              ],
            },
            {
              label: "Assessment",
              body: `"${assessmentFromScore(claim.riskScore)}" — the claim demonstrates unusual payment and utilization patterns compared with relevant peer behavior.`,
            },
            {
              label: "Reasoning",
              body: `The model weighted payment deviation, service intensity and provider-level history. Individually these features are not conclusive, but jointly they place the claim above the ${claim.rating.toLowerCase()}-risk threshold and warrant documentation review before payment release.`,
            },
          ]}
        />
        <div className="space-y-6">
          <Panel title="Risk Composition" icon={Gauge}>
            <ChartFrame title="Cohort Risk Distribution">
              <RiskDonut data={riskDistribution([claim.riskScore, 30, 52, 81, 66, 24, 90, 44])} />
            </ChartFrame>
          </Panel>
          <Panel title="Amount Profile" icon={Activity}>
            <ChartFrame title="Claim Amount Distribution">
              <BarSeries data={amountBuckets([claim.claimAmount, 900, 4200, 13400, 26000, 41000])} />
            </ChartFrame>
          </Panel>
        </div>
      </div>

      <HumanReview status={status} onChange={handleStatus} subject={`Claim ${claim.claimId}`} />
    </div>
  );
}
