import { CURRENCY } from "@/common/const";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });

export const formatMoney = (n: number) => money.format(n);
export const formatNumber = (n: number) => n.toLocaleString("en-US");
