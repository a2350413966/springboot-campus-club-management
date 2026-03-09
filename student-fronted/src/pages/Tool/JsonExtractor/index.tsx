import { InboxOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Upload } from 'antd';
import type { UploadProps, UploadFile } from 'antd';
import React, { useState } from 'react';

const { Dragger } = Upload;

const JsonExtractor: React.FC = () => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [loading, setLoading] = useState(false);

    const props: UploadProps = {
        name: 'file',
        multiple: true,
        fileList,
        beforeUpload: (file) => {
            if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                message.error(`${file.name} 不是 JSON 文件`);
                return Upload.LIST_IGNORE;
            }
            return false; // 仅作为选择文件不直接上传
        },
        onChange(info) {
            // 当返回 false 阻止默认上传时，我们需要手动设置状态才能让文件正确回显在 Dragger 列表里
            const newFileList = info.fileList.map(v => ({ ...v, status: 'done' }) as any);
            setFileList(newFileList);
        },
        onRemove(file) {
            setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
        },
    };

    const handleExtract = async () => {
        if (fileList.length === 0) {
            message.warning('请先选择要提取的 JSON 文件');
            return;
        }

        const formData = new FormData();
        fileList.forEach((fileItem) => {
            // originFileObj 是实际的 File 对象
            const file = fileItem.originFileObj || (fileItem as any);
            if (file instanceof File || file instanceof Blob) {
                formData.append('files', file);
            }
        });

        setLoading(true);
        const hide = message.loading('正在提取中，请稍后...', 0);
        try {
            // 继续使用原生 fetch 避开 Umi 内部针对普通的业务响应 JSON (code === 0) 做的严格拦截校验
            const response = await fetch('/api/tool/json/extract', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`网络或接口请求异常，状态码：${response.status}`);
            }

            const blob = await response.blob();
            // 如果后端报错可能返回了业务错误 JSON
            if (blob.type === 'application/json') {
                const text = await blob.text();
                try {
                    const resJson = JSON.parse(text);
                    throw new Error(resJson.message || '系统内部异常');
                } catch (e) {
                    throw typeof e === 'object' && e !== null && 'message' in e ? e : new Error(String(e));
                }
            }

            // 触发浏览器直接下载
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'extracted_json.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            message.success('恭喜！提取打包成功，正在下载压缩包~');
            setFileList([]); // 清空列表
        } catch (error: any) {
            console.error('Extraction error: ', error);
            message.error(error.message || '提取过程出现异常请重试！');
        } finally {
            hide();
            setLoading(false);
        }
    };

    return (
        <PageContainer title="JSON 中文字段提取工具" subTitle="自动递归保留含中文字符的节点，剔除干净无关内容">
            <Card
                bordered={false}
                title="✨ 开始工作"
                style={{
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Dragger {...props} style={{ padding: '60px 0', border: '2px dashed #1890ff', borderRadius: 12, transition: '0.3s' }}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#1890ff', fontSize: 64, animation: 'float 3s ease-in-out infinite' }} />
                    </p>
                    <p className="ant-upload-text" style={{ fontSize: 20, fontWeight: 600, marginTop: 16 }}>
                        立即点按，或将 `.json` 文件拖放于此区域
                    </p>
                    <p className="ant-upload-hint" style={{ fontSize: 14, color: '#888', marginTop: 12 }}>
                        支持多个文件同时载入。提交后我们将通过深度搜索过滤您的文件结构，最后送上清爽的压缩包。
                    </p>
                </Dragger>

                <div style={{ marginTop: 40, textAlign: 'center' }}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleExtract}
                        loading={loading}
                        style={{
                            padding: '0 64px',
                            height: 52,
                            borderRadius: 26,
                            fontSize: 18,
                            boxShadow: '0 4px 12px rgba(24,144,255,0.4)',
                            fontWeight: 'bold',
                        }}
                    >
                        立即执行提取
                    </Button>
                </div>
            </Card>

            <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
        </PageContainer>
    );
};

export default JsonExtractor;
