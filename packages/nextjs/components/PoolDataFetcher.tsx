"use client";

import { useEffect } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type PoolDataFetcherProps = {
  poolId: number;
  onPoolData: (poolData: any) => void;
};

export const PoolDataFetcher = ({ poolId, onPoolData }: PoolDataFetcherProps) => {
  // Fetch pool basic info
  const { data: poolInfo } = useScaffoldReadContract({
    contractName: "Deadpool",
    functionName: "getPool",
    args: [BigInt(poolId)],
  });

  // Fetch pool depositors
  const { data: depositors } = useScaffoldReadContract({
    contractName: "Deadpool",
    functionName: "getPoolDepositors",
    args: [BigInt(poolId)],
  });

  useEffect(() => {
    if (poolInfo && depositors !== undefined) {
      const [creator, tokenAddress, deadline, totalDeposited, totalMonadReceived, winners, finalized, cancelled] =
        poolInfo;

      const poolData = {
        id: poolId,
        creator,
        tokenAddress,
        deadline: new Date(Number(deadline) * 1000),
        totalDeposited: totalDeposited.toString(),
        totalMonadReceived: totalMonadReceived.toString(),
        winners,
        finalized,
        cancelled,
        participantCount: Array.isArray(depositors) ? depositors.length : 0,
      };

      onPoolData(poolData);
    }
  }, [poolInfo, depositors, poolId, onPoolData]);

  return null; // This component doesn't render anything
};
