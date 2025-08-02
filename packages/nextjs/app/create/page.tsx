"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const CreatePage = () => {
  const { address: connectedAddress } = useAccount();
  const [tokenAddress, setTokenAddress] = useState("");
  const [deadline, setDeadline] = useState("");
  const [platformFee, setPlatformFee] = useState("500"); // 5% default

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

    // For now, just show a notification - we'll implement the actual contract call later
    notification.info("Pool creation will be implemented with the Deadpool contract");
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

            {/* Platform Fee Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform Fee (basis points)</label>
              <input
                type="number"
                value={platformFee}
                onChange={e => setPlatformFee(e.target.value)}
                className="input input-bordered w-full"
                min="0"
                max="10000"
                placeholder="500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Platform fee in basis points (500 = 5%, 1000 = 10%). The rest goes to winners.
              </p>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">💰 Reward Distribution</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span className="font-medium">{(parseInt(platformFee || "0") / 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Winners Share:</span>
                  <span className="font-medium text-green-600">
                    {(100 - parseInt(platformFee || "0") / 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">Winners are split equally among 3 random participants</div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreatePool}
              disabled={!connectedAddress || !tokenAddress || !deadline}
              className="btn text-white w-full text-lg py-3 disabled:opacity-50 blood-gradient hover:scale-105 transition-transform"
            >
              <span className="deadpool-emoji">🪦</span> Create Deadpool
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
