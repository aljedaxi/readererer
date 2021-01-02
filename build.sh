buildAndDeploy() {
	url=$1
	yarn build
	pushd build
	echo $url > ./CNAME
	echo "\n" | surge
	popd
}

buildAndDeploy readererer.surge.sh
