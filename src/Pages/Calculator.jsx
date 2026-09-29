import { useState } from "react";
import { FaCalculator } from "react-icons/fa";
import StandardCalculator from "../Components/StandardCalculator";

export default function PricingCalculator() {
  const [plainCost, setPlainCost] = useState(25);
  const [printCost, setPrintCost] = useState(15);
  const [quantity, setQuantity] = useState(10);
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [markupPercent, setMarkupPercent] = useState(40);

  // Calculations
  const costPerShirt = Number(plainCost) + Number(printCost);
  const totalProductionCost = costPerShirt * Number(quantity);
  const totalCost = totalProductionCost + Number(deliveryFee);

  const profitAmount = totalCost * (Number(markupPercent) / 100);
  const totalQuotePrice = totalCost + profitAmount;
  const pricePerShirtToClient = totalQuotePrice / (Number(quantity) || 1);

  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm max-w-4xl mx-auto">
      <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-5">
        <FaCalculator className="text-orange-500" /> Custom Job Price Calculator
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Job Pricing Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-500">Plain Garment Cost (GH₵ / pc)</label>
              <input
                type="number"
                value={plainCost}
                onChange={(e) => setPlainCost(e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-500">Print Cost (GH₵ / pc)</label>
              <input
                type="number"
                value={printCost}
                onChange={(e) => setPrintCost(e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-500">Quantity (pcs)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="font-semibold text-zinc-500">Delivery Fee (GH₵)</label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-zinc-500 text-xs">Profit Margin (%)</label>
            <input
              type="number"
              value={markupPercent}
              onChange={(e) => setMarkupPercent(e.target.value)}
              className="w-full mt-1 p-2.5 border rounded-xl text-xs bg-zinc-50 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Quote Breakdown */}
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-600">Total Production & Delivery Cost:</span>
              <span className="font-bold">GH₵ {totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Profit Margin ({markupPercent}%):</span>
              <span className="font-bold text-green-600">+ GH₵ {profitAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-orange-200 text-sm font-extrabold text-black">
              <span>Total Client Quote:</span>
              <span className="text-orange-600">GH₵ {totalQuotePrice.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-500 text-right">
              (Quote GH₵ {pricePerShirtToClient.toFixed(2)} per shirt to client)
            </p>
          </div>
        </div>

        {/* Right Side: Quick Math Calculator */}
        <div className="flex flex-col items-center md:items-start">
          <h4 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">
            Quick Math Calculator
          </h4>
          <StandardCalculator />
        </div>

      </div>
    </div>
  );
}