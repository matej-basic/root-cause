FROM golang:1.22-bookworm AS builder

WORKDIR /src
COPY go.mod ./
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /trusted-header-admin .

FROM gcr.io/distroless/static-debian12

COPY --from=builder /trusted-header-admin /trusted-header-admin

EXPOSE 8080

ENTRYPOINT ["/trusted-header-admin"]
