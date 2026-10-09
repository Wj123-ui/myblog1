#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""临时脚本：把动效诊断页传到服务器的站点根，供手机端打开排查。

用完即弃，不进入 git。删除方式：
  python _push_diag.py --remove
"""
import os, sys
import deploy

TARGET = '/var/www/myblog1/diag.html'


def main():
    cfg = deploy.load_config()
    client = deploy.connect(cfg)
    try:
        sftp = client.open_sftp()
        if '--remove' in sys.argv:
            try:
                sftp.remove(TARGET)
                print('已删除', TARGET)
            except IOError as e:
                print('删除失败（可能本来就不存在）:', e)
        else:
            local = os.path.join(deploy.ROOT, 'diag.html')
            sftp.put(local, TARGET)
            print('已上传 ->', TARGET)
        sftp.close()
        deploy.run(client, 'chown www-data:www-data %s && chmod 644 %s' % (TARGET, TARGET),
                   quiet=True)
        print('访问: http://%s/diag.html' % cfg['DEPLOY_HOST'])
    finally:
        client.close()


if __name__ == '__main__':
    main()
