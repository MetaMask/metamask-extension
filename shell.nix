{ pkgs ? import <nixpkgs> {
  overlays = [ 
    (self: super: {
      yarn = super.yarn.override { 
        nodejs = pkgs.nodejs-14_x;
      };
    })
   ];
} }:
  pkgs.mkShell {
    nativeBuildInputs = [ 
      pkgs.nodejs-14_x
      pkgs.yarn
    ];
}

