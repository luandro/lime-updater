## WIP: LibreMesh updater CLI

## Install

Download an executable for your system from the [release]() page.

Or, if you have NodeJS installed, just install the cli with `npm i -g lime-updater`.

## Usage

It's best if the machine you'll run this command has it's ssh key in all nodes in the mesh, or provide the path to the private-key file with the flag `--ssh_key`.

To set same password for all nodes:

`lime-updater --firmware=/home/user/firmware --password=super-secret`

To set a different password for each node, or to run without `authorized_keys`:

`lime-updater --firmware=/home/user/firmware`

### Options

- **--firmware** can be an absolute path in your system of a url where the firmware live. The program expects the files to be arranged as they are cooked ex.: `targets/ar71xx/generic/..`

- **--password** is used to set the same password for every node in the mesh

- **--ssh_key** can be an absolute path in your system of a url where the private ssh key file lives, defaults to your system's `id_rsa` file

- **--nodes** limits the upgrade to only the listed ones separated by `,` wihout spaces; ex.: `lime-updater --firmware=/home/user/firmware --nodes=san,nico,marcos`

- **--post_install** only run post install, copying files and setting configs to the nodes

## After upgrade

If you have acess points which aren't running LibreMesh, and just connect to a node thru ethernet, you'll have to reboot them manually. In case sending the backups back to the nodes fail, you can use `--post_install` to only run the post-upgrade part.

## How it works?

- checks for the most current LibreMesh release from https://github.com/LibreRouterOrg/openwrt
- `ssh`'s into each node in the mesh and finds out their model and checks if they are using outdated firmware
- creates a backup up of their Lime, Pirania and Dropbear configs, as well as Pirania's database and Dropbear's `authorized_keys` in `~/.libremesh`
- finds the distance between the node you're running this from and all the other nodes
- starting from the most distant nodes, it copies the firmware according to the node's model and does a `sysupgrade -n`
- after all nodes have been upgraded it copies the backups back to each one, applies the settings and sets again the password

## Future plans

Ideally this should also be an Android application so that community members can run it on their phones. There should be a social network layer on top for sharing firmware files, making something like a distributed Chef able to provide even offline community networks with new LibreMesh releases.
