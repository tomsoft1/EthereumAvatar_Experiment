pragma solidity >=0.4.19;

contract EthAvatar {
    mapping (address => string) private ipfsHashes;

    event DidSetIPFSHash(address indexed hashAddress, string hash);


    function setIPFSHash(string memory hash) public {
        ipfsHashes[msg.sender] = hash;

        emit DidSetIPFSHash(msg.sender, hash);
    }

    function getIPFSHash(address hashAddress) public view returns (string memory) {
        return ipfsHashes[hashAddress];
    }
}
