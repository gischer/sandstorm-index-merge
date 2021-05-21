capnp eval -I/opt/sandstorm/latest/usr/include -p \
  api-query.capnp appIndexDescriptor | \
  base64 -w0
