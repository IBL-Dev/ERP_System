"use client";

import { useState } from "react";
import { MOVEMENT_STAGES, STAGE_ACTION, STAGE_LABEL } from "@/common/const";
import type { Column, Movement } from "@/common/type";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { useInventory } from "../InventoryProvider";
import { nextStage } from "../utils";

function StageTracker({ movement }: { movement: Movement }) {
  const stages = MOVEMENT_STAGES[movement.kind];
  const current = stages.indexOf(movement.stage);
  return (
    <div className="flex items-center gap-3">
      <div aria-hidden className="flex gap-1">
        {stages.map((stage, i) => (
          <span key={stage} className={cn("h-1.5 w-5 rounded-full", i <= current ? "bg-accent" : "bg-line")} />
        ))}
      </div>
      <StatusBadge tone={current === stages.length - 1 ? "success" : "info"}>{STAGE_LABEL[movement.stage]}</StatusBadge>
    </div>
  );
}

export function MovementsView() {
  const { movements, itemsBySku, advance, advanceAll } = useInventory();
  const [notice, setNotice] = useState<string | null>(null);

  const columns: Column<Movement>[] = [
    { key: "id", header: "Document", cell: (m) => <span className="font-medium">{m.id}</span> },
    { key: "ref", header: "Reference", cell: (m) => m.ref },
    {
      key: "item",
      header: "Item",
      cell: (m) => (
        <div>
          <p>{itemsBySku[m.sku]?.name ?? m.sku}</p>
          <p className="text-xs text-ink-muted">{m.sku}</p>
        </div>
      ),
    },
    { key: "qty", header: "Qty", align: "right", cell: (m) => formatNumber(m.qty) },
    { key: "progress", header: "Progress", cell: (m) => <StageTracker movement={m} /> },
    {
      key: "action",
      header: "Next step",
      cell: (m) => {
        const next = nextStage(m);
        return next ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              advance(m.id);
              setNotice(null);
            }}
          >
            {STAGE_ACTION[next]}
          </Button>
        ) : (
          <span className="text-ink-muted">Completed</span>
        );
      },
    },
  ];

  const inbound = movements.filter((m) => m.kind === "inbound");
  const outbound = movements.filter((m) => m.kind === "outbound");

  const runAuto = () => {
    const moved = advanceAll();
    setNotice(moved ? `Moved ${moved} document${moved === 1 ? "" : "s"} to the next step.` : "Nothing to process.");
  };

  return (
    <>
      <PageHeader
        title="Goods flow"
        code="INV03"
        description="Incoming goods are received into stock. Outgoing orders are picked, packed and shipped. Stock quantities update at each step that changes them."
        actions={<Button onClick={runAuto}>Run auto movement</Button>}
      />

      <Notice>{notice}</Notice>

      <section aria-labelledby="inbound" className="mb-8">
        <h2 id="inbound" className="mb-1 font-semibold">Incoming goods</h2>
        <p className="mb-3 text-sm text-ink-muted">Receiving moves units from in transit to available.</p>
        <DataTable caption="Incoming goods" columns={columns} rows={inbound} rowKey={(m) => m.id} />
      </section>

      <section aria-labelledby="outbound">
        <h2 id="outbound" className="mb-1 font-semibold">Outgoing orders</h2>
        <p className="mb-3 text-sm text-ink-muted">Shipping removes the reserved units from stock.</p>
        <DataTable caption="Outgoing orders" columns={columns} rows={outbound} rowKey={(m) => m.id} />
      </section>
    </>
  );
}
