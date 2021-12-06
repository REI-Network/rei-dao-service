staking-monitor APi
-----------------
### Unstake

获取投票人和其信息

```sh
curl 'http://127.0.0.1:3031/api/Unstake?to=0x70997970C51812dc3A010C7d01b50e0d17dc79C8&validator=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199&offset=2&limit=2' | json_pp
```

参数信息:
```
 to  // 接收人地址
 validator // 验证者地址
 offset    // 查询起始
 limit     // 一次查询个数
```

返回信息：
```json
{
   "result" : [
      {
         "to" : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
         "txHash" : "0x4b2c2abdb8f4f69a858c9e39080c6c1592304026ac4eed7f759bb127b0910038",
         "id" : 2,
         "value" : 410,
         "createdAt" : "2021-10-12T10:02:00.000Z",
         "updatedAt" : "2021-10-12T10:02:00.000Z",
         "validator" : "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
         "timestamp" : 1634032886,
         "from" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "state" : 0,
         "unstakeShares" : 410,
         "unstakedtimestamp" : null,
         "amount" : null
      },
      {
         "createdAt" : "2021-10-12T08:32:29.000Z",
         "value" : 300,
         "updatedAt" : "2021-10-12T08:32:29.000Z",
         "timestamp" : 1634011004,
         "validator" : "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
         "txHash" : "0x5e25b289d3af5540ce3f645166ef726103936a0a7cfaf3099daaf64f0cf6f032",
         "to" : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
         "id" : 0,
         "state" : 1,
         "unstakeShares" : 300,
         "unstakedtimestamp" : 1634011339,
         "amount" : 300,
         "from" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      }
   ]
}
```
- result:所有记录的数组
- to :接受者地址
- txHash :发起StartUnstake的交易哈希
- id : unstake的id
- value: 期望取回的gxc数量
- validator:验证者地址
- timestamp:发起开始取回的时间戳
- from: 发起者
- state: 取回状态，1代表已取回，0代表未取回
- unstakeShares:销毁的shares数量 
- amount:实际取回的gxc数量，未取回时为null
- unstakedtimestamp:取回gxc的时间戳


--------------------
### Depositby

获取地址发起的抵押fee的信息

```sh
curl 'http://127.0.0.1:3032/api/Depositby?address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&offset=0&limit=2' | json_pp
```

参数信息:
```
 address  // 地址
 offset    // 查询起始
 limit     // 一次查询个数
```

返回信息：
```json
{
   "depositByAddress" : [
      {
         "updatedAt" : "2021-12-01T10:13:50.000Z",
         "amount" : "100000",
         "to" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "by" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "txHash" : "0x96f4575d5a86a642da619b03c02565836497419cabf920a5f9a4a6d829c993c4",
         "createdAt" : "2021-12-01T10:13:50.000Z"
      },
      {
         "createdAt" : "2021-12-01T10:14:55.000Z",
         "by" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "txHash" : "0xdd72b5ca5a6ed95afc4a21fa372050efd642a7d37075e0bbd4c82bc2823d89d1",
         "amount" : "340000",
         "to" : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
         "updatedAt" : "2021-12-01T10:14:55.000Z"
      }
   ]
}
```
depositbyAddress: address发起的质押对象


--------------------
### Depositto

获取地址发起的抵押fee的信息

```sh
curl 'http://127.0.0.1:3032/api/Depositto?address=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&offset=0&limit=2' | json_pp
```

参数信息:
```
 address  // 地址
 offset    // 查询起始
 limit     // 一次查询个数
```

返回信息：
```json
{
   "depositToAddress" : [
      {
         "txHash" : "0x96f4575d5a86a642da619b03c02565836497419cabf920a5f9a4a6d829c993c4",
         "to" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "by" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "amount" : "100000",
         "updatedAt" : "2021-12-01T10:13:50.000Z",
         "createdAt" : "2021-12-01T10:13:50.000Z"
      },
      {
         "by" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "amount" : "100000",
         "updatedAt" : "2021-12-02T11:08:19.000Z",
         "to" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "txHash" : "0x857b3ad999b7018ef252d7242c319a0aca26969bd4c82b4235f7b08110a0c2ed",
         "createdAt" : "2021-12-02T11:08:19.000Z"
      }
   ]
}
```
depositToAddress: address接收的质押对象


--------------------
### Stake

获取地址发起的抵押投票的信息

```sh
curl 'http://127.0.0.1:3032/api/Stake?from=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&offset=0&limit=2' | json_pp
```

参数信息:
```
 from  // 发起质押的地址
 offset    // 查询起始
 limit     // 一次查询个数
```

返回信息：
```json
{
   "result" : [
      {
         "from" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "value" : "79",
         "txHash" : "0x4b56096cabdadd06e5b0d1e8b5a4bbf46720adf57182b2983c5f0a08ac1433c3",
         "to" : "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
         "validator" : "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
         "createdAt" : "2021-12-06T09:07:52.000Z",
         "updatedAt" : "2021-12-06T09:07:52.000Z",
         "shares" : "79"
      }
   ]
}
```
- result:所有记录的数组
- txHash :发起Stake的交易哈希
- validator:质押的验证者地址
- from: 发起者地址
- value: 抵押的rei数量
- shares:获得的shares数量

