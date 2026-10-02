import { useMemo, useState } from "react";
import {
  getAdminDataset,
  type AdminDataset,
  type AdminOrder,
  type AdminReturn,
} from "../data/adminData";
import {
  buildOrderIndex,
  resolveRange,
  type DateRange,
  type OrderIndex,
  type RangeKey,
} from "../lib/analytics";
import { useAdminOrders } from "../store/adminOrdersStore";
import { useAdminReturns } from "../store/adminReturnsStore";

export function useAdminDataset(): AdminDataset {
  return useMemo(() => getAdminDataset(), []);
}

export type AdminFeed = {
  dataset: AdminDataset;
  orders: AdminOrder[];
  returns: AdminReturn[];
  index: OrderIndex;
};

export function useAdminFeed(): AdminFeed {
  const dataset = useAdminDataset();
  const orders = useAdminOrders();
  const returns = useAdminReturns();
  const index = useMemo(() => buildOrderIndex(orders), [orders]);

  return { dataset, orders, returns, index };
}

export function useAdminRange(initial: RangeKey = "30d") {
  const [now] = useState(() => Date.now());
  const [key, setKey] = useState<RangeKey>(initial);
  const [custom, setCustom] = useState<DateRange | undefined>();

  const range = useMemo(
    () => resolveRange(key, now, custom),
    [key, custom, now],
  );

  return { now, key, setKey, custom, setCustom, range };
}
