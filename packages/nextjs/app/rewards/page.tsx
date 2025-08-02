"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { notification } from "~~/utils/scaffold-eth";

// Mock data for demonstration - will be replaced with real contract data
const mockRewards = [
  {
    poolId: 5,
    tokenName: "DeadCoin",
    tokenSymbol: "DEAD",
    monadReward: "0.5",
    position: 1, // 1st place
    claimed: true,
    claimedAt: new Date(Date.now() - 86400000), // 1 day ago
    totalPayout: "2.5",
  },
  {
    poolId: 8,
    tokenName: "RuggedMeme",
    tokenSymbol: "RUG",
    monadReward: "1.2",
    position: 3, // 3rd place
    claimed: false,
    claimedAt: null,
    totalPayout: "3.6",
  },
  {
    poolId: 12,
    tokenName: "ZombieCoin",
    tokenSymbol: "ZOMB",
    monadReward: "0.8",
    position: 2, // 2nd place
    claimed: false,
    claimedAt: null,
    totalPayout: "2.4",
  },
];

const mockParticipations = [
  {
    poolId: 15,
    tokenName: "ShitCoin",
    tokenSymbol: "SHIT",
    deposited: "10000",
    deadline: new Date(Date.now() + 86400000 * 3), // 3 days left
    participantCount: 12,
    status: "active",
  },
  {
    poolId: 18,
    tokenName: "WorthlessCoin",
    tokenSymbol: "WTH",
    deposited: "50000",
    deadline: new Date(Date.now() + 86400000), // 1 day left
    participantCount: 25,
    status: "active",
  },
];

const RewardsPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<"rewards" | "participations">("rewards");

  const handleClaimReward = async (poolId: number) => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    // For now, just show a notification - will be replaced with actual contract call
    notification.info(`Claiming reward from pool ${poolId}`);
  };

  const formatTimeLeft = (deadline: Date) => {
    const now = new Date();
    const timeLeft = deadline.getTime() - now.getTime();

    if (timeLeft <= 0) return "Ended";

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h left`;
  };

  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏆";
    }
  };

  const totalUnclaimedRewards = mockRewards
    .filter(r => !r.claimed)
    .reduce((sum, r) => sum + parseFloat(r.monadReward), 0);

  const totalClaimedRewards = mockRewards.filter(r => r.claimed).reduce((sum, r) => sum + parseFloat(r.monadReward), 0);

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block deadpool-emoji">🏆</span>
          <h1 className="text-4xl font-bold mb-4 deadpool-title">My Rewards</h1>
          <p className="text-lg text-gray-600">Track your winnings and active participations in deadpools</p>
        </div>

        {!connectedAddress ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔒</span>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">Please connect your wallet to view your rewards</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow p-6 text-center text-white">
                <div className="text-2xl font-bold">{totalUnclaimedRewards.toFixed(2)} MON</div>
                <div className="text-yellow-100">Unclaimed Rewards</div>
              </div>
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow p-6 text-center text-white">
                <div className="text-2xl font-bold">{totalClaimedRewards.toFixed(2)} MON</div>
                <div className="text-green-100">Total Claimed</div>
              </div>
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow p-6 text-center text-white">
                <div className="text-2xl font-bold">{mockParticipations.length}</div>
                <div className="text-blue-100">Active Pools</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed mb-6 bg-white">
              <button
                className={`tab ${activeTab === "rewards" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("rewards")}
              >
                🏆 My Rewards ({mockRewards.length})
              </button>
              <button
                className={`tab ${activeTab === "participations" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("participations")}
              >
                💀 Active Pools ({mockParticipations.length})
              </button>
            </div>

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <div className="space-y-4">
                {mockRewards.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">😴</span>
                    <h3 className="text-xl font-semibold mb-2">No rewards yet</h3>
                    <p className="text-gray-600">Participate in some deadpools to win rewards!</p>
                  </div>
                ) : (
                  mockRewards.map(reward => (
                    <div
                      key={reward.poolId}
                      className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${
                        reward.claimed ? "border-green-200" : "border-yellow-200"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getPositionEmoji(reward.position)}</span>
                            <h3 className="text-xl font-bold">
                              {reward.tokenName} ({reward.tokenSymbol}) - Pool #{reward.poolId}
                            </h3>
                            {reward.claimed ? (
                              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                <CheckCircleIcon className="h-3 w-3" />
                                Claimed
                              </span>
                            ) : (
                              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">Pending</span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Position:</span>
                              <div className="font-semibold">{reward.position}/3 winner</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Your reward:</span>
                              <div className="font-semibold text-green-600">{reward.monadReward} MON</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Total pool payout:</span>
                              <div className="font-semibold">{reward.totalPayout} MON</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <div className="font-semibold">{reward.claimed ? "Claimed" : "Ready to claim"}</div>
                            </div>
                          </div>

                          {reward.claimed && reward.claimedAt && (
                            <div className="text-xs text-gray-500 mt-2">
                              Claimed on {reward.claimedAt.toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div className="lg:min-w-[150px]">
                          {reward.claimed ? (
                            <button className="btn btn-success w-full" disabled>
                              ✅ Claimed
                            </button>
                          ) : (
                            <button onClick={() => handleClaimReward(reward.poolId)} className="btn btn-primary w-full">
                              💰 Claim {reward.monadReward} MON
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Participations Tab */}
            {activeTab === "participations" && (
              <div className="space-y-4">
                {mockParticipations.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">💤</span>
                    <h3 className="text-xl font-semibold mb-2">No active participations</h3>
                    <p className="text-gray-600">Join some deadpools to see them here!</p>
                  </div>
                ) : (
                  mockParticipations.map(participation => (
                    <div
                      key={participation.poolId}
                      className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">⏳</span>
                            <h3 className="text-xl font-bold">
                              {participation.tokenName} ({participation.tokenSymbol}) - Pool #{participation.poolId}
                            </h3>
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">Active</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Your deposit:</span>
                              <div className="font-semibold">
                                {parseInt(participation.deposited).toLocaleString()} tokens
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Participants:</span>
                              <div className="font-semibold">{participation.participantCount} players</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Time left:</span>
                              <div className="font-semibold flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                {formatTimeLeft(participation.deadline)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:min-w-[150px]">
                          <div className="text-center">
                            <div className="text-sm text-gray-500">Win chance</div>
                            <div className="text-lg font-bold text-blue-600">
                              {((3 / participation.participantCount) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
