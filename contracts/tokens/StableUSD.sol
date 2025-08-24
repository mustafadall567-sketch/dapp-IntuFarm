// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StableUSD
 * @dev ERC-20 stablecoin with permit functionality and role-based access control
 * @notice This is a testnet implementation with centralized minting for ease of testing
 * WARNING: Never deploy this pattern to mainnet without proper collateralization
 */
contract StableUSD is ERC20, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Maximum supply cap (100M tokens)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    constructor(
        address admin,
        address treasury
    ) ERC20("StableUSD", "sUSD") ERC20Permit("StableUSD") {
        require(admin != address(0), "StableUSD: admin cannot be zero address");
        require(treasury != address(0), "StableUSD: treasury cannot be zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(MINTER_ROLE, treasury);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);

        // Initial mint to treasury for testing (1M tokens)
        _mint(treasury, 1_000_000 * 1e18);
    }

    /**
     * @dev Mint tokens to specified address
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "StableUSD: mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "StableUSD: exceeds max supply");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @dev Burn tokens from specified address
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) whenNotPaused {
        require(from != address(0), "StableUSD: burn from zero address");
        require(balanceOf(from) >= amount, "StableUSD: insufficient balance");
        
        _burn(from, amount);
        emit Burn(from, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount to burn
     */
    function burnSelf(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "StableUSD: insufficient balance");
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount);
    }

    /**
     * @dev Pause all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override transfer to implement pause functionality
     */
    function _update(address from, address to, uint256 value) internal virtual override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
