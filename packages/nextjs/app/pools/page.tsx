"use client";
/* eslint-disable */

import { useCallback, useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { ClockIcon, CurrencyDollarIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { PoolDataFetcher } from "~~/components/PoolDataFetcher";
import deployedContracts from "~~/contracts/deployedContracts";

// Define pool data type
type PoolData = {
  id: number;
  creator: string;
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  deadline: Date;
  totalDeposited: string;
  totalMonadReceived: string;
  winners: [string, string, string];
  finalized: boolean;
  cancelled: boolean;
  participantCount: number;
  platformFeeBps?: number;
};

const PoolsPage = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedPool, setSelectedPool] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [poolIds, setPoolIds] = useState<number[]>([]);

  // Read the next pool ID to know how many pools exist
  const { data: nextPoolId } = useScaffoldReadContract({
    contractName: "Deadpool",
    functionName: "nextPoolId",
  });

  // Generate array of pool IDs when nextPoolId changes
  useEffect(() => {
    if (nextPoolId && Number(nextPoolId) > 1) {
      const ids = [];
      for (let i = 1; i < Number(nextPoolId); i++) {
        ids.push(i);
      }
      setPoolIds(ids);
      setIsLoading(true);
    } else {
      setPoolIds([]);
      setPools([]);
      setIsLoading(false);
    }
  }, [nextPoolId]);

  // Handle pool data received from PoolDataFetcher components
  const handlePoolData = useCallback((poolData: PoolData) => {
    setPools(prevPools => {
      const existingIndex = prevPools.findIndex(p => p.id === poolData.id);
      if (existingIndex >= 0) {
        // Update existing pool
        const newPools = [...prevPools];
        newPools[existingIndex] = poolData;
        return newPools;
      } else {
        // Add new pool
        const newPools = [...prevPools, poolData].sort((a, b) => a.id - b.id);
        return newPools;
      }
    });
  }, []);

  // Set loading to false when we have data for all pool IDs
  useEffect(() => {
    if (poolIds.length > 0 && pools.length === poolIds.length) {
      setIsLoading(false);
    }
  }, [pools.length, poolIds.length]);

  // Contract write functions
  const { writeContractAsync: depositToPoolContract } = useScaffoldWriteContract("Deadpool");
  const { writeContractAsync: finalizePoolContract } = useScaffoldWriteContract("Deadpool");
  const { writeContractAsync: writeErc20Async } = useWriteContract();



  const handleDeposit = async (poolId: number) => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!depositAmount) {
      notification.error("Please enter a deposit amount");
      return;
    }

    try {
      const deadpoolAddress = (deployedContracts as any)[10143]?.Deadpool?.address as `0x${string}`;

      // 1) Approve tokens
      const erc20Abi = [
        {
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ] as const;

      await writeErc20Async({
        address: pools.find(p => p.id === poolId)!.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [deadpoolAddress, BigInt(depositAmount)],
      });

      // 2) Deposit to pool
      await depositToPoolContract({
        functionName: "depositToPool",
        args: [BigInt(poolId), BigInt(depositAmount)],
      } as any);

      notification.success("🪦 Tokens approved and deposited successfully!");
      setSelectedPool(null);
      setDepositAmount("");

      // Reload pools to get updated data
      window.location.reload();
    } catch (error: any) {
      console.error("Error depositing:", error);
      notification.error(error?.message || "Failed to deposit tokens");
    }
  };

  const handleFinalizePool = async (poolId: number) => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    try {
      await finalizePoolContract({
        functionName: "finalizePool",
        args: [BigInt(poolId)],
      } as any);

      notification.success("🏆 Pool finalized! Winners have been selected!");

      // Reload pools to get updated data
      window.location.reload();
    } catch (error: any) {
      console.error("Error finalizing pool:", error);
      notification.error(error?.message || "Failed to finalize pool");
    }
  };

  const isPoolExpired = (deadline: Date) => {
    return new Date() > deadline;
  };

  const formatTimeLeft = (deadline: Date) => {
    const now = new Date();
    const timeLeft = deadline.getTime() - now.getTime();

    if (timeLeft <= 0) return "Ended";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h left`;
  };

  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      {/* Render PoolDataFetcher components for each pool ID */}
      {poolIds.map(poolId => (
        <PoolDataFetcher
          key={poolId}
          poolId={poolId}
          onPoolData={handlePoolData}
        />
      ))}
      
      <div className="px-5 w-full max-w-6xl">
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block deadpool-emoji">💰</span>
          <h1 className="text-4xl font-bold mb-4 deadpool-title">Browse Deadpools</h1>
          <p className="text-lg text-gray-600">
            Find active pools and deposit your matching dead tokens for a chance to win!
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? "..." : pools.filter(p => !p.finalized && !p.cancelled).length}
            </div>
            <div className="text-gray-600">Active Pools</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? "..." : pools.reduce((sum, p) => sum + p.participantCount, 0)}
            </div>
            <div className="text-gray-600">Total Participants</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {isLoading ? "..." : pools.filter(p => p.finalized).length}
            </div>
            <div className="text-gray-600">Completed Pools</div>
          </div>
        </div>

        {/* Pool List */}
        {isLoading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-gray-600">Loading pools...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map(pool => (
              <div
                key={pool.id}
                className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${
                  pool.finalized ? "border-gray-300 opacity-75" : "border-green-200 hover:shadow-xl transition-shadow"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Pool Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">Pool #{pool.id}</h3>
                      {pool.finalized && (
                        <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">Finished</span>
                      )}
                      {!pool.finalized && isPoolExpired(pool.deadline) && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
                          Ready to Finalize
                        </span>
                      )}
                      {!pool.finalized && !isPoolExpired(pool.deadline) && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Active</span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <span>Token:</span>
                        <Address address={pool.tokenAddress as any} size="sm" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Creator:</span>
                        <Address address={pool.creator as any} size="sm" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                        <span>{formatTimeLeft(pool.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                        <span>{formatNumber(pool.totalDeposited)} tokens</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4 text-gray-500" />
                        <span>{pool.participantCount} participants</span>
                      </div>
                      <div className="text-gray-500">Managed by contract</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="lg:min-w-[150px]">
                    {pool.finalized ? (
                      <button className="btn btn-disabled w-full" disabled>
                        <span className="deadpool-emoji">⚰️</span> Pool Ended
                      </button>
                    ) : isPoolExpired(pool.deadline) ? (
                      <button
                        onClick={() => handleFinalizePool(pool.id)}
                        className="btn text-white w-full blood-gradient hover:scale-105 transition-transform animate-pulse"
                        disabled={!connectedAddress}
                      >
                        <span className="deadpool-emoji">⚡</span> Finalize Pool
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedPool(pool.id)}
                        className="btn text-white w-full zombie-gradient hover:scale-105 transition-transform"
                        disabled={!connectedAddress}
                      >
                        <span className="deadpool-emoji">💀</span> Deposit Tokens
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {pools.length === 0 && (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">😔</span>
                <h3 className="text-xl font-semibold mb-2">No pools found</h3>
                <p className="text-gray-600">Be the first to create a deadpool!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Deposit Tokens</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Pool: {pools.find(p => p.id === selectedPool)?.tokenAddress || "Unknown Token"}
              </p>
              <p className="text-sm text-gray-600">
                Current participants: {pools.find(p => p.id === selectedPool)?.participantCount || 0}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Deposit</label>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter amount"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Make sure you approve the contract to spend your tokens first!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPool(null);
                  setDepositAmount("");
                }}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeposit(selectedPool)}
                className="btn btn-primary flex-1"
                disabled={!depositAmount}
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolsPage;
