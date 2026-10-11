# Multi-stage build for the Root Cause flagger sidecar.
# Stage 1 compiles a static, CGO-free binary; stage 2 ships only that binary.

FROM golang:1.23-alpine AS build
WORKDIR /src

# go.mod first so the module metadata layer caches independently of the source.
COPY go.mod ./
COPY main.go ./

# CGO disabled and a trimmed build produce a static binary that runs on scratch.
ENV CGO_ENABLED=0 GOOS=linux
RUN go build -trimpath -ldflags="-s -w" -o /flagger .

FROM scratch

# CA certificates so the HTTPS call to the API verifies.
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /flagger /flagger

ENTRYPOINT ["/flagger"]
