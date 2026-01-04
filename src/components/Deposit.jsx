import React, { useState } from 'react'

function Deposit({setDeposit}) {
    const [showDepositModal, setShowDepositModal] = useState(true);
    const [copied, setCopied] = useState(false);

    const usdtWalletAddress = "T9F8GnEXAMPLERv78yGwN4HQJpJk3EN"; // Example wallet address

    const handleDeposit = () => {
        setShowDepositModal(true); // Show the deposit modal
    };

    const handleCloseModal = () => {
        setShowDepositModal(false); // Close the modal
        setDeposit(false)
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(usdtWalletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    return (
        <div>
            {showDepositModal && (
                <div className="fixed z-50 px-4 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white py-6 px-4 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Deposit USDT</h2>
                        <p className="text-gray-600 mb-2">Deposit USDT to the following wallet address:</p>
                        <div className="flex items-center space-x-2 mb-4">
                            <input
                                type="text"
                                value={usdtWalletAddress}
                                readOnly
                                className="w-full p-2 border border-gray-300 rounded-lg"
                            />
                            <button
                                onClick={handleCopyAddress}
                                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">After depositing, please allow some time for confirmation.</p>
                        <div className="flex justify-between">
                            <button
                                onClick={handleCloseModal}
                                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Deposit