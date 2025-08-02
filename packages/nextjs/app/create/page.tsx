"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const CreatePage = () => {
  const { address: connectedAddress } = useAccount();
  const [tokenAddress, setTokenAddress] = useState("");
  const [deadline, setDeadline] = useState("");
  // Platform fee is now managed by the contract, no longer needed as state
  const [isCreating, setIsCreating] = useState(false);

  // Read contract constants
  const { data: minDuration } = useScaffoldReadContract({
    contractName: "Deadpool",
    functionName: "MIN_POOL_DURATION",
  });

  const { data: maxDuration } = useScaffoldReadContract({
    contractName: "Deadpool",
    functionName: "MAX_POOL_DURATION",
  });

  // Write contract function
  const { writeContractAsync: createDeadpool } = useScaffoldWriteContract("Deadpool");

  const handleCreatePool = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet first");
      return;
    }

    if (!tokenAddress) {
      notification.error("Please enter a token address");
      return;
    }

    if (!deadline) {
      notification.error("Please set a deadline");
      return;
    }

    try {
      setIsCreating(true);

      // Convert deadline to duration in seconds
      const deadlineTimestamp = new Date(deadline).getTime();
      const currentTimestamp = Date.now();
      const durationInSeconds = Math.floor((deadlineTimestamp - currentTimestamp) / 1000);

      // Validate duration
      if (minDuration && durationInSeconds < Number(minDuration)) {
        notification.error(`Duration must be at least ${Number(minDuration) / 3600} hours`);
        return;
      }

      if (maxDuration && durationInSeconds > Number(maxDuration)) {
        notification.error(`Duration must be at most ${Number(maxDuration) / (24 * 3600)} days`);
        return;
      }

      await createDeadpool({
        functionName: "createDeadpool",
        args: [tokenAddress, BigInt(durationInSeconds)],
      });

      notification.success("🪦 Deadpool created successfully!");

      // Reset form
      setTokenAddress("");
      setDeadline("");
    } catch (error: any) {
      console.error("Error creating pool:", error);
      notification.error(error?.message || "Failed to create pool");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block deadpool-emoji">⚰️</span>
          <h1 className="text-4xl font-bold mb-4 deadpool-title">Create a Deadpool</h1>
          <p className="text-lg text-gray-600">
            Start a lottery for any dead token. Set your terms and watch others join the fun!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
          <div className="space-y-6">
            {/* Connected Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pool Creator</label>
              <Address address={connectedAddress} />
            </div>

            {/* Token Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dead Token Address <span className="text-red-500">*</span>
              </label>
              <AddressInput placeholder="0x..." value={tokenAddress} onChange={setTokenAddress} />
              <p className="text-sm text-gray-500 mt-1">Enter the contract address of the dead/worthless token</p>
            </div>

            {/* Deadline Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pool Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="input input-bordered w-full"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-sm text-gray-500 mt-1">When should the pool close and winners be selected?</p>
            </div>

            {/* Platform Fee Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform Fee (set by contract)</label>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Platform fee is managed by the contract owner and will be applied automatically when the pool is
                  finalized.
                </p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">💰 How It Works</h3>
              <div className="text-sm space-y-1">
                <div>• Dead tokens are pooled together until deadline</div>
                <div>• At deadline, tokens are swapped for Monad (MON)</div>
                <div>• Platform fee is deducted automatically</div>
                <div>• Remaining MON is split equally among 3 random winners</div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreatePool}
              disabled={!connectedAddress || !tokenAddress || !deadline || isCreating}
              className="btn text-white w-full text-lg py-3 disabled:opacity-50 blood-gradient hover:scale-105 transition-transform"
            >
              {isCreating ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <span className="deadpool-emoji">🪦</span>
              )}
              {isCreating ? "Creating..." : "Create Deadpool"}
            </button>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">ℹ️ How it works:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Anyone can deposit the specified dead token into your pool</li>
                <li>• When the deadline is reached, tokens are swapped for Monad</li>
                <li>• 3 random depositors split the Monad rewards</li>
                <li>• You take a small platform fee for creating the pool</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
