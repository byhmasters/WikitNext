# WikitNext

于Vercel上部署的轻量维基引擎

将代码拉到Vercel并创建同地区的Postgres数据库，然后在你的本地电脑执行以下操作：
### 1. 依赖
`npm install`
### Vercel→Storage→你的数据库→.env.local里复制数据库URL
`export DATABASE_URL='postgres://USER:PASSWORD@HOST/DB?sslmode=require'`

`npm run db:push`
### 3. (可选)初始页面
`npm run db:seed`

访问网站，创建的第一个账号主管理员账号。
