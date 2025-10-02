import React from 'react';

export const AddEthereumChainRenderer = ({
  data,
  matchedChain,
}: {
  data: any;
  matchedChain: any;
}) => {
  const title = 'Update BNB Smart Chain';
  const description = 'A site is suggesting additional network details.';

  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>

      <div>
        <ListItem title={'Request from'} subtitle={data.origin} />
      </div>

      <pre>{JSON.stringify(matchedChain, null, 2)}</pre>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

function ListItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-row justify-between">
      <p>{title}</p>
      <p>{subtitle}</p>
    </div>
  );
}
