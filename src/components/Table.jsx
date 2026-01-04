import React from 'react';

const Table = ({ columns, data, renderRow, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-4 py-2 font-bold border-b-2 border-gray-200 bg-blue-500 text-left  text-white text-sm uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-100">
              {renderRow(item)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;



const team = [
  {
    imgUrl: ' https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2020.28.51_e396f6f2.jpg?alt=media&amp;token=450ac3b6-83cf-4e9d-adc6-70258a9876ad',
    name: 'Adesoji Praise-God A.',
    post: 'CEO/Founder'
  },
  {
    imgUrl: ' <https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2015.06.39_e9490f78.jpg?alt=media&amp;token=6c13f75c-974c-4abe-9e8b-3f85b8198f44',
    name: 'Akinbote Oreoluwa R.',
    post: 'Co-founder/COO'
  },

  {
    imgUrl: 'https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2015.07.37_255fb7bc.jpg?alt=media&amp;token=d8fe6f77-57b0-43a8-863c-f360e4eb88ca',
    name: 'Olujinmi Olamide',
    post: "Chief Admin"
  },

  {
    imgUrl: 'https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2015.07.37_9cfb73cd.jpg?alt=media&amp;token=553a46c3-b31a-483e-9098-49717a951862',
    name: 'Ojo Oluwatunmininu',
    post: 'Chief Technology Officer (CTO)'
  },

  {
    imgUrl: 'https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2015.06.40_3331ca6c.jpg?alt=media&amp;token=ec84c6b7-2c3c-48bf-90c6-aedb3e915891',
    name: 'Olakunle Doyinsola',
    post: 'Director for Partnerships'
  },
  {
    imgUrl: 'https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2015.09.17_82f3bc03.jpg?alt=media&amp;token=f4b4d56b-d687-41d1-bb9e-62f05e3f13b4',
    name: 'Ogundimu Tosin',
    post: 'Team Lead, Research and Innovation'
  },
  {
    imgUrl: 'https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2020.28.52_29416c9b.jpg?alt=media&amp;token=32bbb70c-9e17-4182-8570-9fc66c6f0c35, Adeniyi ', name: 'Christopher',
    post: 'Social Media Manager'
  },

  {
    imgUrl: 'https://firebasestorage.googleapis.com/v0/b/clymechange.appspot.com/o/images%2Fteam%2FWhatsApp%20Image%202024-09-09%20at%2020.42.02_eb43d007.jpg?alt=media&amp;token=1d839629-eaca-456b-8971-9f72361b777',
    name: 'Tolulope-O-Lawal ',
    post: 'Finance Officer/Accountant'
  }
]