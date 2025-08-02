"use client";

/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CurrencyDollarIcon, PlusIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 text-center">
          <div className="mb-6">
            <span className="text-6xl mb-4 block deadpool-emoji">🪦</span>
            <h1 className="text-center">
              <span className="block text-2xl mb-2 text-gray-600">Welcome to</span>
              <span className="block text-5xl font-bold bg-gradient-to-r from-red-600 to-black bg-clip-text text-transparent deadpool-title">
                DEADPOOL
              </span>
            </h1>
            <p className="text-xl text-gray-700 mt-4 max-w-2xl mx-auto">
              Turn your dead tokens into treasure! <span className="deadpool-emoji">💰</span> Deposit worthless coins,
              win Monad rewards.
            </p>
          </div>

          <div className="flex justify-center items-center space-x-2 flex-col mb-8">
            <p className="my-2 font-medium">Connected Wallet:</p>
            <Address address={connectedAddress} />
          </div>

          <div className="bg-gray-100 p-6 rounded-xl max-w-4xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-4">🎲 How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg shadow">
                <span className="text-2xl mb-2 block">1️⃣</span>
                <h3 className="font-bold">Create or Join</h3>
                <p className="text-sm">Create a deadpool for any worthless token or join existing ones</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <span className="text-2xl mb-2 block">2️⃣</span>
                <h3 className="font-bold">Wait & Watch</h3>
                <p className="text-sm">Watch the timer count down as tokens accumulate in the pool</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <span className="text-2xl mb-2 block">3️⃣</span>
                <h3 className="font-bold">Win Big!</h3>
                <p className="text-sm">3 random winners split the Monad rewards when time's up</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grow bg-gradient-to-b from-gray-100 to-gray-200 w-full mt-8 px-8 py-12">
          <div className="flex justify-center items-center gap-8 flex-col lg:flex-row">
            <div className="deadpool-card flex flex-col bg-white px-8 py-8 text-center items-center max-w-xs rounded-2xl shadow-lg border-2 border-red-200 hover:shadow-xl transition-shadow spooky-shadow">
              <PlusIcon className="h-12 w-12 text-red-600 mb-4 deadpool-bounce" />
              <h3 className="font-bold text-lg mb-2">Create Deadpool</h3>
              <p className="text-gray-600 mb-4">Start a new lottery for any dead token you want to get rid of</p>
              <Link
                href="/create"
                className="btn text-white px-6 py-2 rounded-full blood-gradient hover:scale-105 transition-transform"
              >
                <span className="deadpool-emoji">⚰️</span> Create Pool
              </Link>
            </div>

            <div className="deadpool-card flex flex-col bg-white px-8 py-8 text-center items-center max-w-xs rounded-2xl shadow-lg border-2 border-green-200 hover:shadow-xl transition-shadow spooky-shadow">
              <CurrencyDollarIcon className="h-12 w-12 text-green-600 mb-4 deadpool-bounce" />
              <h3 className="font-bold text-lg mb-2">Browse Pools</h3>
              <p className="text-gray-600 mb-4">Find active deadpools and deposit your matching dead tokens</p>
              <Link
                href="/pools"
                className="btn text-white px-6 py-2 rounded-full zombie-gradient hover:scale-105 transition-transform"
              >
                <span className="deadpool-emoji">💀</span> Browse Pools
              </Link>
            </div>

            <div className="deadpool-card flex flex-col bg-white px-8 py-8 text-center items-center max-w-xs rounded-2xl shadow-lg border-2 border-yellow-200 hover:shadow-xl transition-shadow spooky-shadow">
              <TrophyIcon className="h-12 w-12 text-yellow-600 mb-4 deadpool-bounce" />
              <h3 className="font-bold text-lg mb-2">Check Rewards</h3>
              <p className="text-gray-600 mb-4">See if you've won any rewards from completed deadpools</p>
              <Link
                href="/rewards"
                className="btn btn-accent text-white px-6 py-2 rounded-full hover:scale-105 transition-transform"
              >
                <span className="deadpool-emoji">🏆</span> My Rewards
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600 mb-2">Built on Monad Testnet</p>
            <div className="flex justify-center gap-4">
              <Link href="/debug" className="text-xs text-gray-500 hover:text-gray-700">
                Debug Contracts
              </Link>
              <Link href="/blockexplorer" className="text-xs text-gray-500 hover:text-gray-700">
                Block Explorer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
