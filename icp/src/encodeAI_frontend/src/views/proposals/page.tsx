import GlassContainer from "../../lib/components/molecules/glass-container";

import IntentsFeed from "../../lib/components/organisms/docs-feed";

const ProposalHome = async () => {
  return (
    <GlassContainer>
      <p className="pt-4 px-4 pb-2 font-semibold text-xl">Proposals</p>
      <div className="rounded-2xl bg-[#F8F8F7] p-4">
        <IntentsFeed />
      </div>
    </GlassContainer>
  );
};

export default ProposalHome;
