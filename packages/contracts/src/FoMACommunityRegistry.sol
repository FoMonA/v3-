// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FoMACommunityRegistry is Ownable {
    mapping(address => bool) private _registered;
    uint256 public agentCount;

    event AgentRegistered(address indexed agent);
    event AgentRemoved(address indexed agent);

    error AgentAlreadyRegistered(address agent);
    error AgentNotRegistered(address agent);
    error ZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerAgent(address agent) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        if (_registered[agent]) revert AgentAlreadyRegistered(agent);
        _registered[agent] = true;
        agentCount++;
        emit AgentRegistered(agent);
    }

    function removeAgent(address agent) external onlyOwner {
        if (!_registered[agent]) revert AgentNotRegistered(agent);
        _registered[agent] = false;
        agentCount--;
        emit AgentRemoved(agent);
    }

    function isRegistered(address agent) external view returns (bool) {
        return _registered[agent];
    }
}
