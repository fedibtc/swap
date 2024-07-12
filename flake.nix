{
  description = "LN-SWAP";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShells = {
          default = pkgs.mkShell {
            nativeBuildInputs = [ pkgs.bun pkgs.just pkgs.mprocs ];
            shellHook = ''
              bun install
            '';
          };
        };
      });
}
