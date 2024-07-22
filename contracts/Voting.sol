// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Proposal {
        uint id;
        string description;
        uint voteCount;
    }

    mapping(uint => Proposal) public proposals;
    uint public nextProposalId;
    mapping(address => mapping(uint => bool)) public votes;

    function createProposal(string memory _description) public {
        proposals[nextProposalId] = Proposal(nextProposalId, _description, 0);
        nextProposalId++;
    }

    function vote(uint _proposalId) public {
        require(!votes[msg.sender][_proposalId], "Already voted");
        proposals[_proposalId].voteCount++;
        votes[msg.sender][_proposalId] = true;
    }

    function getProposal(uint _proposalId) public view returns (Proposal memory) {
        return proposals[_proposalId];
    }
}
