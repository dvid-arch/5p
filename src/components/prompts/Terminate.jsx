import React, { useState } from 'react'

function Terminate() {
    const [showDepositModal, setShowDepositModal] = useState(true);
   

  


  

    return (
        <div>
            {showDepositModal && (
                <div className="fixed px-4 inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white py-6 px-4 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Terminate Investment</h2>
                        <p className="text-gray-600 mb-2">Deposit USDT to the following wallet address:</p>
                      
                        <p className="text-gray-600 text-sm mb-4">After depositing, please allow some time for confirmation.</p>
                      
                    </div>
                </div>
            )}

        </div>
    )
}

export default Terminate