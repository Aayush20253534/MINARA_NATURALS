import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <Container className="page-state page-state--loading"><Skeleton className="skeleton-kicker"/><Skeleton className="skeleton-title"/><Skeleton className="skeleton-copy"/><div className="skeleton-grid"><Skeleton/><Skeleton/><Skeleton/></div></Container>;
}
